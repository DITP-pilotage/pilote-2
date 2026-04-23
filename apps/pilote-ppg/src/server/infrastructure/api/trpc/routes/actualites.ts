import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const actualitesRouter = créerRouteurTRPC({
  listerNewsletters: procédureProtégée.query(async () => {
    return getContainer("actualites")
      .resolve("listerNewslettersUseCase")
      .execute();
  }),
});
