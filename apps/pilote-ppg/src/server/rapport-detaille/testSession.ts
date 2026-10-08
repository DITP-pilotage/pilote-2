import { Session } from "next-auth";
import type { HabilitationChantiers } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

const habilitationVide: HabilitationChantiers = {
  __meta: {
    aAccesTousLesChantiers: false,
    aAccesTousLesTerritoires: false,
    aAccesTousLesPerimetres: false,
  },
  chantiers: [],
  territoires: [],
  périmètres: [],
};

export function buildTestSession(surcharges: Partial<Session> = {}): Session {
  return {
    expires: "2026-12-31T00:00:00.000Z",
    user: { id: "utilisateur-1", email: "test@example.com" },
    accessToken: "jeton",
    habilitations: {
      lecture: habilitationVide,
      saisieCommentaire: habilitationVide,
      saisieIndicateur: habilitationVide,
      responsabilite: habilitationVide,
      gestionUtilisateur: habilitationVide,
    },
    applicationsAccessibles: [],
    profil: "DITP_ADMIN",
    profilAAccèsAuxChantiersBrouillons: false,
    ...surcharges,
  };
}
