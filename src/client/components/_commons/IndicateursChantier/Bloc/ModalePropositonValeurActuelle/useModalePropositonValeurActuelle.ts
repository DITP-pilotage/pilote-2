import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { validationPropositionValeurActuelle } from '@/validation/proposition-valeur-actuelle';
import api from '@/server/infrastructure/api/trpc/api';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

interface PropositionValeurActuelleForm {
  valeurActuelle: string
  motifProposition: string
  sourceDonneeEtMethodeCalcul: string
  dateValeurActuelle: string
  indicId: string
  territoireCode: string
}

const useModalePropositonValeurActuelle = ({ detailIndicateur, indicateur }: {
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur
}) => {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const mutationCreerPropositonValeurActuelle = api.propositionValeurActuelle.creer.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
    },
    onError: error => {
      console.log(error);
    },
  });

  const creerPropositonValeurActuelle: SubmitHandler<PropositionValeurActuelleForm > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
      valeurActuelle: data.valeurActuelle,
      dateValeurActuelle: detailIndicateur.dateValeurActuelle!,
      indicId: indicateur.id,
      territoireCode: territoireSélectionné?.code!,
    };


    mutationCreerPropositonValeurActuelle.mutate(inputs);
  };

  const reactHookForm = useForm<PropositionValeurActuelleForm>({
    mode: 'all',
    resolver: zodResolver(validationPropositionValeurActuelle),
    defaultValues: {
      valeurActuelle: `${detailIndicateur.valeurActuelle}`,
      motifProposition: '',
      sourceDonneeEtMethodeCalcul: '',
      dateValeurActuelle: detailIndicateur.dateValeurActuelle!,
      indicId: indicateur.id,
      territoireCode: territoireSélectionné?.code!,
    },
  });

  return {
    reactHookForm,
    creerPropositonValeurActuelle,
    submitSuccess,
  };
};

export default useModalePropositonValeurActuelle;
