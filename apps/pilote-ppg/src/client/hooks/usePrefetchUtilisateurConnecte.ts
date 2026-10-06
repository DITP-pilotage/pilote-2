import { useSession } from "next-auth/react";
import { api } from "@/server/framework/trpc/api";
import { useBootstrap } from "@/components/_commons/Bootstrap/BootstrapContext";

const PROFIL_STALE_TIME_MS = 60_000;

export function usePrefetchUtilisateurConnecte() {
  const session = useSession();
  const { utilisateurConnecte } = useBootstrap();
  api.profilUtilisateur.getUtilisateurConnecte.useQuery(undefined, {
    enabled: session.status === "authenticated",
    initialData: utilisateurConnecte,
    staleTime: PROFIL_STALE_TIME_MS,
  });
}
