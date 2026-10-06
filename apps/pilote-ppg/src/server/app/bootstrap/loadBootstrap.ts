import type { Session } from "next-auth";
import { getContainer } from "@/server/dependances";
import type { Bootstrap } from "@/client/components/_commons/Bootstrap/BootstrapContext";

const removeUndefinedKeys = (target: object) => {
  for (const [key, value] of Object.entries(target)) {
    if (value === undefined) {
      Reflect.deleteProperty(target, key);
    } else if (value !== null && typeof value === "object") {
      removeUndefinedKeys(value);
    }
  }
};

// Next refuse `undefined` dans les props : ces clés sont retirées, comme elles
// disparaîtraient de la réponse JSON d'une requête tRPC.
const toSerializableProps = <T extends object>(value: T): T => {
  const copy = structuredClone(value);
  removeUndefinedKeys(copy);
  return copy;
};

/**
 * Données dont toutes les pages ont besoin avant de s'afficher. Les passer en props
 * évite au navigateur trois allers-retours en cascade : `/api/auth/session`, puis
 * les variables de contenu (qui suspendent la page), puis le profil connecté.
 */
export const loadBootstrap = async (session: Session): Promise<Bootstrap> => {
  const [variablesContenu, utilisateurConnecte] = await Promise.all([
    getContainer("gestionContenu")
      .resolve("recupererToutesLesVariablesContenuUseCase")
      .run(),
    getContainer("profilUtilisateur")
      .resolve("getProfilUtilisateurQuery")
      .run(session.user.id),
  ]);

  return {
    session: toSerializableProps(session),
    variablesContenu: toSerializableProps(variablesContenu),
    utilisateurConnecte,
  };
};
