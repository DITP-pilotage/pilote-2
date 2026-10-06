import { api } from "@/server/framework/trpc/api";
import { useBootstrap } from "@/components/_commons/Bootstrap/BootstrapContext";

const PROFIL_STALE_TIME_MS = 60_000;

export const useProfilUtilisateurConnecte = () => {
  const { utilisateurConnecte } = useBootstrap();
  const [utilisateur] =
    api.profilUtilisateur.getUtilisateurConnecte.useSuspenseQuery(undefined, {
      initialData: utilisateurConnecte,
      staleTime: PROFIL_STALE_TIME_MS,
    });
  return utilisateur;
};
