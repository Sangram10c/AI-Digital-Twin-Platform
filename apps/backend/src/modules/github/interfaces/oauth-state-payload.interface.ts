export interface OAuthStatePayload {
  userId: string;
  workspaceId?: string;
  nonce: string;
  exp: number;
}
