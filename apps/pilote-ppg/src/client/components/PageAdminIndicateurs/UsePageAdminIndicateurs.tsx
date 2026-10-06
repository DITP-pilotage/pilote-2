import { useRouter } from "next/router";
import { api } from "@/server/framework/trpc/api";

export default function usePageAdminIndicateurs() {
  const { data: identifiantGénéré } =
    api.metadataIndicateur.recupererMetadataIndicateurIdentifiantGenere.useQuery(
      undefined,
      { refetchIntervalInBackground: true },
    );

  const router = useRouter();

  const naviguerVersCreationIndicateur = () => {
    return router.push({
      pathname: `indicateurs/${identifiantGénéré}`,
      query: { _action: "creer-indicateur" },
    });
  };

  return {
    naviguerVersCreationIndicateur,
  };
}
