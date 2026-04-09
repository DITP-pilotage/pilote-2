-- 1. Nouvelles colonnes
ALTER TABLE "public"."llm_calls"
  ADD COLUMN "chat_id" TEXT,
  ADD COLUMN "input_tokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "output_tokens" INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill : chat_id = ancien id ; tokens lus depuis le transcript stringifié
UPDATE "public"."llm_calls"
SET
  "chat_id" = "id",
  "input_tokens"  = COALESCE(((("transcript"#>>'{}')::jsonb) -> 'usage' ->> 'inputTokens')::int, 0),
  "output_tokens" = COALESCE(((("transcript"#>>'{}')::jsonb) -> 'usage' ->> 'outputTokens')::int, 0);

-- 3. chat_id devient NOT NULL
ALTER TABLE "public"."llm_calls" ALTER COLUMN "chat_id" SET NOT NULL;

-- 4. id repasse en UUID auto-généré (les anciennes lignes reçoivent un nouveau PK)
ALTER TABLE "public"."llm_calls" DROP CONSTRAINT "llm_calls_pkey";
ALTER TABLE "public"."llm_calls" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "public"."llm_calls" ALTER COLUMN "id" TYPE UUID USING gen_random_uuid();
ALTER TABLE "public"."llm_calls" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "public"."llm_calls" ADD CONSTRAINT "llm_calls_pkey" PRIMARY KEY ("id");

-- 5. Index sur chat_id
CREATE INDEX "llm_calls_chat_id_idx" ON "public"."llm_calls"("chat_id");
