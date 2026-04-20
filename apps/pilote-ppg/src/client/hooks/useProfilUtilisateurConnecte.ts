import api from "@/server/infrastructure/api/trpc/api";

export const useProfilUtilisateurConnecte = () => {
  const [utilisateur] =
    api.profilUtilisateur.getUtilisateurConnecte.useSuspenseQuery();
  return utilisateur;
};
