import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import type { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import type { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

const verifierAcces = async (session: {
  profil: ProfilCode;
  habilitations: Habilitations;
}) => {
  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  if (!featureFlips["NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR"]) {
    throw new UnauthorizedError("Fonctionnalité non disponible");
  }
  const habilitations = await getContainer("gestionUtilisateur")
    .resolve("habilitationService")
    .recupererHabilitations(session);
  habilitations.verifierAutorisationLectureIndicateursNonAJour();
};

export const indicateursNonAJourRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    await verifierAcces(ctx.session);
    const jalon = getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );
    return getContainer("suiviIndicateurs")
      .resolve("listerIndicateursNonAJourQuery")
      .run(ctx.session.habilitations.lecture.chantiers, jalon);
  }),

  listerTerritoires: procédureProtégée
    .input(z.object({ indicateurId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await verifierAcces(ctx.session);
      return getContainer("suiviIndicateurs")
        .resolve("listerTerritoiresNonAJourQuery")
        .run(input.indicateurId, ctx.session.habilitations.lecture.chantiers);
    }),
});
