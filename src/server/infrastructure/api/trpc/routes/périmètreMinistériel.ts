import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const périmètreMinistérielRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée.query(() => {
    return getContainer("gestionUtilisateur")
      .resolve("recupererPerimetresMinisterielsUseCase")
      .run({ perimetresMinisterielsIds: [] });
  }),
});
