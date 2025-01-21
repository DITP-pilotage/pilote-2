-- AddForeignKey
ALTER TABLE "public"."territoire" ADD CONSTRAINT "territoire_code_parent_fkey" FOREIGN KEY ("code_parent") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
