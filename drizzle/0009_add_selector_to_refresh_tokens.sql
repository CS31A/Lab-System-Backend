-- Add selector column for O(1) refresh token lookups
-- This prevents O(N) bcrypt scans by using an indexable selector + hashed verifier pattern

ALTER TABLE "refresh_tokens" ADD COLUMN "selector" varchar(12) NOT NULL DEFAULT '';

-- Remove the unique constraint on token_hash since we'll have multiple tokens with different selectors
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_token_hash_unique";

-- Add unique constraint on selector for fast lookups
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_selector_unique" UNIQUE("selector");

-- Add index on expires_at for efficient cleanup queries
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" ("expires_at");

-- Remove the default empty string constraint after adding the column
ALTER TABLE "refresh_tokens" ALTER COLUMN "selector" DROP DEFAULT;