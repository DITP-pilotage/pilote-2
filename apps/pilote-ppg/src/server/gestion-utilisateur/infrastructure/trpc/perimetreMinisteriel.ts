import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const perimetreMinisterielRouter = createTRPCRouter({
  list: protectedProcedure.query(() => {
    return getContainer("gestionUtilisateur")
      .resolve("recupererPerimetresMinisterielsUseCase")
      .run({ perimetresMinisterielsIds: [] });
  }),
});
