import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";

export function usePrefetchUtilisateurConnecte() {
  const session = useSession();
  const [enabled, setEnabled] = useState(false);
  api.profilUtilisateur.getUtilisateurConnecte.useQuery(undefined, { enabled });

  useEffect(() => {
    if (session.status !== "authenticated") return;
    setEnabled(true);
  }, [session.status]);
}
