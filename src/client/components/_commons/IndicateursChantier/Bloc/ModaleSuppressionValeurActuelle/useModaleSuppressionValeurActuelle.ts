import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { récupérerUnCookie } from '@/client/utils/cookies';

export const useModaleSuppressionValeurActuelle = ({ indicateur, territoireCode }: {
  indicateur: Indicateur,
  territoireCode: string
}) => {

  const { data: session } = useSession();

  const auteurModification = session?.user.name!;

  const [estSupprime, setEstSupprime] = useState<boolean>(false);

  const mutationCreerPropositonValeurActuelle = api.propositionValeurActuelle.supprimer.useMutation({
    onSuccess: () => {
      setEstSupprime(true);
    },
  });

  const supprimerPropositionValeurActuelle = async () => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      indicId: indicateur.id,
      auteurModification,
      territoireCode,
    };

    mutationCreerPropositonValeurActuelle.mutate(inputs);
  };

  return {
    supprimerPropositionValeurActuelle,
    estSupprime,
  };
};
