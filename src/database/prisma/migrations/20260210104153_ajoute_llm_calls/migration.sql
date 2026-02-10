-- CreateTable
CREATE TABLE "public"."llm_calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prompt" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_calls_pkey" PRIMARY KEY ("id")
);
