import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const actualitesRouter = createTRPCRouter({
  listerNewsletters: protectedProcedure.query(async () => {
    return getContainer("actualites")
      .resolve("listerNewslettersUseCase")
      .execute();
  }),
});
