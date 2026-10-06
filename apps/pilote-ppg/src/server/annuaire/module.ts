import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaUtilisateurRepository";
import { ListerCoordinateursAnnuaireQuery } from "./queries/ListerCoordinateursAnnuaireQuery";
import { ListerResponsablesAnnuaireQuery } from "./queries/ListerResponsablesAnnuaireQuery";

type AnnuaireCradle = {
  utilisateurRepository: UtilisateurRepository;
  listerCoordinateursAnnuaireQuery: ListerCoordinateursAnnuaireQuery;
  listerResponsablesAnnuaireQuery: ListerResponsablesAnnuaireQuery;
};

export const annuaireModule = defineModule<NoExports, AnnuaireCradle>()({
  name: "annuaire",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
      listerCoordinateursAnnuaireQuery: asModuleClass(
        ListerCoordinateursAnnuaireQuery,
      ),
      listerResponsablesAnnuaireQuery: asModuleClass(
        ListerResponsablesAnnuaireQuery,
      ),
    } satisfies VerifyCradle<AnnuaireCradle>);
  },
});

type Scope = ExtractScope<typeof annuaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
