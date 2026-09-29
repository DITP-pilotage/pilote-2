import api from "@/server/infrastructure/api/trpc/api";
import { useDonneesCommunesPage } from "@/components/_commons/DonneesCommunesPage/DonneesCommunesPageContext";

const DUREE_FRAICHEUR_PROFIL_EN_MS = 60_000;

export const useProfilUtilisateurConnecte = () => {
  const { utilisateurConnecte } = useDonneesCommunesPage();
  const [utilisateur] =
    api.profilUtilisateur.getUtilisateurConnecte.useSuspenseQuery(undefined, {
      initialData: utilisateurConnecte,
      staleTime: DUREE_FRAICHEUR_PROFIL_EN_MS,
    });
  return utilisateur;
};
