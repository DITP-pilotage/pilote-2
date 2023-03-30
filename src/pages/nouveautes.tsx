import Nouveautés from '@/components/Nouveautés/Nouveautés';
import api from '@/server/infrastructure/api/trpc/api';

export default function NextPageNouveautés() {
  const { data: indicateur } = api.indicateur.récupérerLePremier.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  return (
    <>
      {
        JSON.stringify(indicateur)
      }
      <Nouveautés />
    </>
  );
}
