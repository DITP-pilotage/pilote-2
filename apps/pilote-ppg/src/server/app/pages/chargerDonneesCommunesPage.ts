import type { Session } from "next-auth";
import { getContainer } from "@/server/dependances";
import type { DonneesCommunesPage } from "@/client/components/_commons/DonneesCommunesPage/DonneesCommunesPageContext";

const retirerLesClesUndefined = (objet: object) => {
  for (const [cle, valeur] of Object.entries(objet)) {
    if (valeur === undefined) {
      Reflect.deleteProperty(objet, cle);
    } else if (valeur !== null && typeof valeur === "object") {
      retirerLesClesUndefined(valeur);
    }
  }
};

// Next refuse `undefined` dans les props : ces clés sont retirées, comme elles
// disparaîtraient de la réponse JSON d'une requête tRPC.
const versPropsSerialisables = <T extends object>(valeur: T): T => {
  const copie = structuredClone(valeur);
  retirerLesClesUndefined(copie);
  return copie;
};

/**
 * Données dont toutes les pages ont besoin avant de s'afficher. Les passer en props
 * évite au navigateur trois allers-retours en cascade : `/api/auth/session`, puis
 * les variables de contenu (qui suspendent la page), puis le profil connecté.
 */
export const chargerDonneesCommunesPage = async (
  session: Session,
): Promise<DonneesCommunesPage> => {
  const [variablesContenu, utilisateurConnecte] = await Promise.all([
    getContainer("legacy")
      .resolve("recupererToutesLesVariablesContenuUseCase")
      .run(),
    getContainer("profilUtilisateur")
      .resolve("getProfilUtilisateurQuery")
      .run(session.user.id),
  ]);

  return {
    session: versPropsSerialisables(session),
    variablesContenu: versPropsSerialisables(variablesContenu),
    utilisateurConnecte,
  };
};
