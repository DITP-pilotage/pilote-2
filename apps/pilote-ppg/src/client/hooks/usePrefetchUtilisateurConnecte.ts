import { useSession } from "next-auth/react";
import api from "@/server/infrastructure/api/trpc/api";

export function usePrefetchUtilisateurConnecte() {
  const session = useSession();
  api.profilUtilisateur.getUtilisateurConnecte.useQuery(undefined, {
    enabled: session.status === "authenticated",
  });
}
