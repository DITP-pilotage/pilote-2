import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { presenterEnListeNewsletterContrat } from "@/server/actualites/app/contrats/NewsletterContrat";

export const actualitesRouter = créerRouteurTRPC({
  listerNewsletters: procédureProtégée.query(async () => {
    return presenterEnListeNewsletterContrat(
      await getContainer("actualites")
        .resolve("listerNewslettersUseCase")
        .execute(),
    );
  }),
});
