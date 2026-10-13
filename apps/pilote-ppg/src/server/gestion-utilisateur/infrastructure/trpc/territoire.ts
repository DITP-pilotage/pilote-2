import { z } from "zod";
import { TerritoireAvecNombreUtilisateurs } from "@/shared/territoire/Territoire.interface";
import { getContainer } from "@/server/dependances";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";

const validation = z.object({
  territoireCodes: z.array(z.string()).nullable(),
});

export const territoireRouter = createTRPCRouter({
  list: protectedProcedure
    .input(validation)
    .query(async ({ input }): Promise<TerritoireAvecNombreUtilisateurs[]> => {
      // Une liste vide (gestionnaire sans territoire) ne donne aucun territoire ; null les donne tous.
      if (input.territoireCodes?.length === 0) {
        return [];
      }
      return getContainer("gestionUtilisateur")
        .resolve("recupererTerritoiresAvecNombreUtilisateursUseCase")
        .run({ territoireCodes: input.territoireCodes });
    }),
});
