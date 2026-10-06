import type { Session } from "next-auth";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { loadBootstrap } from "@/server/app/bootstrap/loadBootstrap";
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

describe("loadBootstrap", () => {
  it(
    "fournit la session sans clé undefined, que Next refuse dans les props",
    createIntegrationTest(async () => {
      const utilisateur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
      });
      // Auth.js laisse `image` à undefined quand l'IdP ne fournit pas d'avatar
      const utilisateurSession = {
        id: utilisateur.id,
        email: utilisateur.email,
        image: undefined,
      };
      const session: Session = {
        expires: "2026-09-29T12:00:00.000Z",
        user: utilisateurSession,
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
      };

      const donnees = await loadBootstrap(session);

      expect(donnees.session).toStrictEqual({
        ...session,
        user: { id: utilisateur.id, email: utilisateur.email },
      });
    }),
  );

  it(
    "fournit le profil de l'utilisateur connecté et les variables de contenu",
    createIntegrationTest(async () => {
      const utilisateur = await fixtures.utilisateur({
        nom: "Martin",
        prenom: "Marie",
        email: "marie.martin@example.com",
      });
      const session: Session = {
        expires: "2026-09-29T12:00:00.000Z",
        user: { id: utilisateur.id, email: utilisateur.email },
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
      };

      const donnees = await loadBootstrap(session);

      expect(donnees.utilisateurConnecte).toEqual(
        expect.objectContaining({
          id: utilisateur.id,
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
        }),
      );
      expect(Object.values(donnees.variablesContenu)).not.toContain(undefined);
    }),
  );
});
