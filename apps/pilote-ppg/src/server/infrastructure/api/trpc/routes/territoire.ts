import { z } from "zod";
import { TerritoireAvecNombreUtilisateurs } from "@/server/domain/territoire/Territoire.interface";
import { getContainer } from "@/server/dependances";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/framework/trpc/trpc";

const validation = z.object({
  territoireCodes: z.array(z.string()).nullable(),
});

export const territoireRouter = créerRouteurTRPC({
  récupérerListe: procédureProtégée
    .input(validation)
    .query(async ({ input }): Promise<TerritoireAvecNombreUtilisateurs[]> => {
      return getContainer("gestionUtilisateur")
        .resolve("recupererTerritoiresAvecNombreUtilisateursSQLUseCase")
        .run({ territoireCodes: input.territoireCodes });
    }),
});
