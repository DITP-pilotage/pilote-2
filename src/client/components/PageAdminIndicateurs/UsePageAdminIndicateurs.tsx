import { useRouter } from 'next/router';
import api from '@/server/infrastructure/api/trpc/api';

export default function usePageAdminIndicateurs() {

  const { data: identifiantGénéré } = api.metadataIndicateur.récupérerMetadataIndicateurIdentifiantGénéré.useQuery(undefined, { refetchIntervalInBackground: true });

  const router = useRouter();

  const naviguerVersCreationIndicateur = () => {
    return router.push( { pathname: `indicateurs/${identifiantGénéré}`, query: { _action: 'creer-indicateur' } });
  };

  return {
    naviguerVersCreationIndicateur,
  };
}
