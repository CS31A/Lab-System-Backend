ALTER TABLE "refresh_tokens" RENAME COLUMN "token_has" TO "token_hash";--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_token_has_unique";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash");