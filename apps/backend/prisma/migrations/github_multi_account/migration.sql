-- Allow multiple GitHub accounts per user and shared tokens across workspaces.

ALTER TABLE "connected_accounts" DROP CONSTRAINT IF EXISTS "connected_accounts_oauth_token_id_key";

DROP INDEX IF EXISTS "uq_oauth_tokens_user_provider";

CREATE UNIQUE INDEX "uq_oauth_tokens_user_provider_account"
  ON "oauth_tokens"("user_id", "provider", "provider_account_id");
