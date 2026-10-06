import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";

export const annuaireRouter = créerRouteurTRPC({
  coordinateurs: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerCoordinateursAnnuaireQuery").run(),
  ),
  responsables: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerResponsablesAnnuaireQuery").run(),
  ),
});
