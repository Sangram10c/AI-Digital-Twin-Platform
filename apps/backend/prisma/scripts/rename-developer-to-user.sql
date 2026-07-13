-- Rename legacy Developer identity tables/columns to User (non-destructive).
-- Safe to re-run: each step checks existence before altering.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeveloperRole')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    ALTER TYPE "DeveloperRole" RENAME TO "UserRole";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'developers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE "developers" RENAME TO "users";
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sessions',
    'refresh_tokens',
    'oauth_tokens',
    'workspace_members',
    'connected_accounts',
    'conversations',
    'pinned_conversations',
    'search_histories',
    'saved_searches',
    'notifications',
    'notification_preferences',
    'audit_logs'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'developer_id'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I RENAME COLUMN developer_id TO user_id',
        tbl
      );
    END IF;
  END LOOP;
END $$;
