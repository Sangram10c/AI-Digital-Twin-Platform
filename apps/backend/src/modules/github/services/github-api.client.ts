import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubEmail } from '../interfaces/github-profile.interface';
import { GitHubTokenResponse } from '../interfaces/github-token-response.interface';
import { GitHubProfile } from '../interfaces/github-profile.interface';

@Injectable()
export class GithubApiClient {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(state: string): string {
    const clientId = this.requireClientId();
    const callbackUrl = this.requireCallbackUrl();
    const scopes =
      this.configService.get<string[]>('oauth.github.scopes') ?? [];
    const authorizeUrl =
      this.configService.get<string>('oauth.github.authorizeUrl') ??
      'https://github.com/login/oauth/authorize';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
      scope: scopes.join(' '),
      allow_signup: 'true',
    });

    return `${authorizeUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    const clientId = this.requireClientId();
    const clientSecret = this.requireClientSecret();
    const callbackUrl = this.requireCallbackUrl();
    const tokenUrl =
      this.configService.get<string>('oauth.github.tokenUrl') ??
      'https://github.com/login/oauth/access_token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to exchange GitHub authorization code',
      );
    }

    const data = (await response.json()) as GitHubTokenResponse & {
      error?: string;
      error_description?: string;
    };

    if (data.error || !data.access_token) {
      throw new BadRequestException(
        data.error_description ?? data.error ?? 'GitHub token exchange failed',
      );
    }

    return data;
  }

  async getAuthenticatedUser(accessToken: string): Promise<GitHubProfile> {
    const apiBaseUrl =
      this.configService.get<string>('oauth.github.apiBaseUrl') ??
      'https://api.github.com';

    const response = await fetch(`${apiBaseUrl}/user`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub user profile');
    }

    const data = (await response.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string | null;
      html_url: string;
      email: string | null;
    };

    return {
      id: data.id,
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
      email: data.email,
    };
  }

  async getPrimaryEmail(accessToken: string): Promise<string | null> {
    const apiBaseUrl =
      this.configService.get<string>('oauth.github.apiBaseUrl') ??
      'https://api.github.com';

    const response = await fetch(`${apiBaseUrl}/user/emails`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails = (await response.json()) as GitHubEmail[];
    const primaryVerified = emails.find(
      (email) => email.primary && email.verified,
    );
    const verified = emails.find((email) => email.verified);

    return (
      primaryVerified?.email ?? verified?.email ?? emails[0]?.email ?? null
    );
  }

  async getRepositoryFileContent(input: {
    accessToken: string;
    owner: string;
    repo: string;
    path: string;
    ref?: string;
  }): Promise<{ path: string; content: string; sha: string } | null> {
    const apiBaseUrl =
      this.configService.get<string>('oauth.github.apiBaseUrl') ??
      'https://api.github.com';
    const params = new URLSearchParams();
    if (input.ref) params.set('ref', input.ref);

    const url = `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/contents/${input.path.replace(/^\/+/, '')}${
      params.toString() ? `?${params}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${input.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch GitHub file ${input.path} (${response.status})`,
      );
    }

    const data = (await response.json()) as {
      type?: string;
      path?: string;
      content?: string;
      encoding?: string;
      sha?: string;
    };

    if (data.type !== 'file' || !data.content) {
      return null;
    }

    const content =
      data.encoding === 'base64'
        ? Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString(
            'utf8',
          )
        : data.content;

    return {
      path: data.path ?? input.path,
      content,
      sha: data.sha ?? '',
    };
  }

  async getRepositoryTreePaths(input: {
    accessToken: string;
    owner: string;
    repo: string;
    ref?: string;
  }): Promise<string[]> {
    const apiBaseUrl =
      this.configService.get<string>('oauth.github.apiBaseUrl') ??
      'https://api.github.com';
    const ref = input.ref ?? 'HEAD';
    const url = `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/git/trees/${encodeURIComponent(ref)}?recursive=1`;

    const response = await this.requestWithRateLimit(url, input.accessToken);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      tree?: Array<{ path?: string; type?: string }>;
    };

    return (data.tree ?? [])
      .filter((node) => node.type === 'blob' && node.path)
      .map((node) => node.path as string);
  }

  /**
   * Page through a GitHub list endpoint using Link-header / page cursors.
   * Yields one page at a time — never loads the full result set into memory.
   */
  async *paginateJsonArray<T>(input: {
    accessToken: string;
    path: string;
    query?: Record<string, string | number | undefined>;
    perPage?: number;
    startPage?: number;
    maxPages?: number;
  }): AsyncGenerator<{ items: T[]; page: number; hasNext: boolean }> {
    const apiBaseUrl =
      this.configService.get<string>('oauth.github.apiBaseUrl') ??
      'https://api.github.com';
    const perPage = input.perPage ?? 100;
    let page = input.startPage ?? 1;
    const maxPages = input.maxPages ?? 100;

    while (page <= maxPages) {
      const params = new URLSearchParams();
      params.set('per_page', String(perPage));
      params.set('page', String(page));
      for (const [key, value] of Object.entries(input.query ?? {})) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      }

      const url = `${apiBaseUrl}${input.path}?${params.toString()}`;
      const response = await this.requestWithRateLimit(url, input.accessToken);
      if (!response.ok) {
        throw new BadRequestException(
          `GitHub pagination failed for ${input.path} page=${page} (${response.status})`,
        );
      }

      const items = (await response.json()) as T[];
      const link = response.headers.get('link') ?? '';
      const hasNext =
        /rel="next"/.test(link) && Array.isArray(items) && items.length > 0;

      yield { items: Array.isArray(items) ? items : [], page, hasNext };

      if (!hasNext || items.length === 0) {
        break;
      }
      page += 1;
    }
  }

  listCommitsPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    sha?: string;
    since?: string;
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/commits`,
      query: { sha: input.sha, since: input.since },
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listPullRequestsPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    state?: 'open' | 'closed' | 'all';
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls`,
      query: {
        state: input.state ?? 'all',
        sort: 'updated',
        direction: 'desc',
      },
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listIssuesPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    state?: 'open' | 'closed' | 'all';
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues`,
      query: {
        state: input.state ?? 'all',
        sort: 'updated',
        direction: 'desc',
      },
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listReleasesPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/releases`,
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listTagsPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/tags`,
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listContributorsPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/contributors`,
      query: { anon: 'false' },
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  listPullRequestReviewsPage(input: {
    accessToken: string;
    owner: string;
    repo: string;
    pullNumber: number;
    startPage?: number;
    perPage?: number;
  }) {
    return this.paginateJsonArray<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls/${input.pullNumber}/reviews`,
      startPage: input.startPage,
      perPage: input.perPage,
    });
  }

  private async requestWithRateLimit(
    url: string,
    accessToken: string,
    attempt = 0,
  ): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    const remaining = Number(
      response.headers.get('x-ratelimit-remaining') ?? '1',
    );
    const resetAt = Number(response.headers.get('x-ratelimit-reset') ?? '0');

    if (response.status === 403 && remaining === 0 && attempt < 3) {
      const waitMs = Math.max(resetAt * 1000 - Date.now(), 1000);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(waitMs, 60_000)),
      );
      return this.requestWithRateLimit(url, accessToken, attempt + 1);
    }

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '5');
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(retryAfter * 1000, 60_000)),
      );
      return this.requestWithRateLimit(url, accessToken, attempt + 1);
    }

    return response;
  }

  private requireClientId(): string {
    const clientId = this.configService.get<string>('oauth.github.clientId');
    if (!clientId) {
      throw new InternalServerErrorException(
        'GitHub client ID is not configured',
      );
    }
    return clientId;
  }

  private requireClientSecret(): string {
    const clientSecret = this.configService.get<string>(
      'oauth.github.clientSecret',
    );
    if (!clientSecret) {
      throw new InternalServerErrorException(
        'GitHub client secret is not configured',
      );
    }
    return clientSecret;
  }

  private requireCallbackUrl(): string {
    const callbackUrl = this.configService.get<string>(
      'oauth.github.callbackUrl',
    );
    if (!callbackUrl) {
      throw new InternalServerErrorException(
        'GitHub callback URL is not configured',
      );
    }
    return callbackUrl;
  }
}
