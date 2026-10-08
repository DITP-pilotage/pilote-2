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
      return getContainer("gestionUtilisateur")
        .resolve("recupererTerritoiresAvecNombreUtilisateursSQLUseCase")
        .run({ territoireCodes: input.territoireCodes });
    }),
});
