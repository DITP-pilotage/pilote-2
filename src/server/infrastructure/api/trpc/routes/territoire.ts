import { z } from "zod";
import { TerritoireAvecNombreUtilisateurs } from "@/server/domain/territoire/Territoire.interface";
import { getContainer } from "@/server/dependances";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { RécupérerTerritoiresAvecNombreUtilisateursUseCase } from "@/server/usecase/territoire/RécupérerTerritoiresAvecNombreUtilisateursUseCase";

const validation = z.object({
  territoireCodes: z.array(z.string()).nullable(),
});

export const territoireRouter = créerRouteurTRPC({
  récupérerListe: procédureProtégée
    .input(validation)
    .query(async ({ input }): Promise<TerritoireAvecNombreUtilisateurs[]> => {
      return new RécupérerTerritoiresAvecNombreUtilisateursUseCase({
        territoireRepository: getContainer("legacy").resolve(
          "territoireRepository",
        ),
        utilisateurRepository: getContainer("legacy").resolve(
          "utilisateurRepository",
        ),
      }).run({ territoireCodes: input.territoireCodes });
    }),
});
