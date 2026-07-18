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

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${input.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

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
