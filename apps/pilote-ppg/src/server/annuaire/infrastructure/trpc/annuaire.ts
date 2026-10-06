import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const annuaireRouter = createTRPCRouter({
  coordinateurs: protectedProcedure.query(() =>
    getContainer("annuaire").resolve("listerCoordinateursAnnuaireQuery").run(),
  ),
  responsables: protectedProcedure.query(() =>
    getContainer("annuaire").resolve("listerResponsablesAnnuaireQuery").run(),
  ),
});
