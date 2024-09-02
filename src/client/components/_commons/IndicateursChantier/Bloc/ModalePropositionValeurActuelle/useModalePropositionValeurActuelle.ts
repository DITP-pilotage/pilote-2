import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { validationPropositionValeurActuelle } from '@/validation/proposition-valeur-actuelle';
import api from '@/server/infrastructure/api/trpc/api';
import { récupérerUnCookie } from '@/client/utils/cookies';

interface PropositionValeurActuelleForm {
  valeurActuelle: string
  motifProposition: string
  sourceDonneeEtMethodeCalcul: string
  dateValeurActuelle: string
  indicId: string
  territoireCode: string
}

export enum EtapePropositionValeurActuelle {
  SAISIE_VALEUR_ACTUELLE = 'SAISIE_VALEUR_ACTUELLE',
  VALIDATION_VALEUR_ACTUELLE = 'VALIDATION_VALEUR_ACTUELLE',
}

export const Stepper: Record<EtapePropositionValeurActuelle[keyof EtapePropositionValeurActuelle & number], {
  numeroEtape: number,
  titre: string,
  etapeSuivante: string | null
}> = {
  [EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE]: {
    numeroEtape: 1,
    titre: 'Saisie de la proposition',
    etapeSuivante: 'Validation de la proposition',
  },
  [EtapePropositionValeurActuelle.VALIDATION_VALEUR_ACTUELLE]: {
    numeroEtape: 2,
    titre: 'Validation de la proposition',
    etapeSuivante: null,
  },
};

const useModalePropositionValeurActuelle = ({ detailIndicateur, indicateur, territoireCode }: {
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur,
  territoireCode: string
}) => {

  const { data: session } = useSession();

  const auteurModification = session?.user.name;

  const [etapePropositionValeurActuelle, setEtapePropositionValeurActuelle] = useState<EtapePropositionValeurActuelle | null>(EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE);

  const mutationCreerPropositonValeurActuelle = api.propositionValeurActuelle.creer.useMutation({
    onSuccess: () => {
      setEtapePropositionValeurActuelle(null);
    },
  });

  const creerPropositonValeurActuelle: SubmitHandler<PropositionValeurActuelleForm > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
      valeurActuelle: data.valeurActuelle,
      dateValeurActuelle: detailIndicateur.dateValeurActuelle!,
      indicId: indicateur.id,
      auteurModification,
      territoireCode,
    };


    mutationCreerPropositonValeurActuelle.mutate(inputs);
  };

  const reactHookForm = useForm<PropositionValeurActuelleForm>({
    mode: 'all',
    resolver: zodResolver(validationPropositionValeurActuelle),
    defaultValues: detailIndicateur.proposition === null ? {
      valeurActuelle: `${detailIndicateur.valeurActuelle}`,
      motifProposition: '',
      sourceDonneeEtMethodeCalcul: '',
      dateValeurActuelle: detailIndicateur.dateValeurActuelle!,
      indicId: indicateur.id,
      territoireCode,
    } : {
      valeurActuelle: `${detailIndicateur.proposition.valeurActuelle}`,
      motifProposition: detailIndicateur.proposition.motif || '',
      sourceDonneeEtMethodeCalcul: detailIndicateur.proposition.sourceDonneeEtMethodeCalcul || '',
      dateValeurActuelle: detailIndicateur.dateValeurActuelle!,
      indicId: indicateur.id,
      territoireCode,
    },
  });

  reactHookForm.watch('motifProposition');
  reactHookForm.watch('sourceDonneeEtMethodeCalcul');

  return {
    reactHookForm,
    creerPropositonValeurActuelle,
    etapePropositionValeurActuelle,
    setEtapePropositionValeurActuelle,
    auteurModification,
  };
};

export default useModalePropositionValeurActuelle;
