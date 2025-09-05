ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_token_hash_unique";--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_expires_at_unique";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "selector" varchar(12) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_selector_idx" ON "refresh_tokens" USING btree ("selector");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_selector_unique" UNIQUE("selector");