import { useSession } from "next-auth/react";
import api from "@/server/infrastructure/api/trpc/api";
import { useDonneesCommunesPage } from "@/components/_commons/DonneesCommunesPage/DonneesCommunesPageContext";

const DUREE_FRAICHEUR_PROFIL_EN_MS = 60_000;

export function usePrefetchUtilisateurConnecte() {
  const session = useSession();
  const { utilisateurConnecte } = useDonneesCommunesPage();
  api.profilUtilisateur.getUtilisateurConnecte.useQuery(undefined, {
    enabled: session.status === "authenticated",
    initialData: utilisateurConnecte,
    staleTime: DUREE_FRAICHEUR_PROFIL_EN_MS,
  });
}
