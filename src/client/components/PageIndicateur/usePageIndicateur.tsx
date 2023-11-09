import { SubmitHandler, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MetadataParametrageIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur/useDetailMetadataIndicateurForm';
import api from '@/server/infrastructure/api/trpc/api';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import {
  MetadataParametrageParametreCalculIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur/useDétailsMetadataParametreCalculIndicateurForm';
import {
  MetadataParametrageAutresIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur/useDétailsMetadataAutresIndicateurForm';
import {
  MetadataSelectionIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm';
import { validationMetadataIndicateurFormulaire } from '@/validation/metadataIndicateur';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import {
  MetadataParametrageParametreIndicateurDepartementaleForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale/useDétailsMetadataParametreIndicateurDepartementaleForm';
import {
  MetadataParametrageParametreIndicateurRegionaleForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale/useDétailsMetadataParametreIndicateurRegionaleForm';
import {
  MetadataParametrageParametreIndicateurNationaleForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale/useDétailsMetadataParametreIndicateurNationaleForm';
import {
  MetadataParametrageParametrePonderationIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur/useDétailsMetadataParametrePonderationndicateurForm';


type MetadataIndicateurForm = MetadataParametrageIndicateurForm
& MetadataParametrageParametreCalculIndicateurForm
& MetadataParametrageParametreIndicateurDepartementaleForm
& MetadataParametrageParametreIndicateurRegionaleForm
& MetadataParametrageParametreIndicateurNationaleForm
& MetadataParametrageAutresIndicateurForm
& MetadataSelectionIndicateurForm
& MetadataParametrageParametrePonderationIndicateurForm;

export const usePageIndicateur = (indicateur: MetadataParametrageIndicateurContrat) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const reactHookForm = useForm<MetadataIndicateurForm>(
    {
      resolver: zodResolver(validationMetadataIndicateurFormulaire),
      defaultValues: {
        ...indicateur,
        indicIsPerseverant: indicateur.indicIsPerseverant ? 'true' : 'false',
        indicIsBaro: indicateur.indicIsBaro ? 'true' : 'false',
        indicIsPhare: indicateur.indicIsPhare ? 'true' : 'false',
        indicHiddenPilote: indicateur.indicHiddenPilote ? 'false' : 'true',
        poidsPourcentNat: `${indicateur.poidsPourcentNat}`,
        poidsPourcentReg: `${indicateur.poidsPourcentReg}`,
        poidsPourcentDept: `${indicateur.poidsPourcentDept}`,
        indicParentIndic: indicateur.indicParentIndic === null ? 'Aucun indicateur selectionné' : indicateur.indicParentIndic,
      },
    },
  );

  const [estEnCoursDeModification, setEstEnCoursDeModification] = useState<boolean>(false);

  const mutationModifierMetadataIndicateur = api.metadataIndicateur.modifier.useMutation({
    onSuccess: () => {
      router.reload();
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });
  const mutationCreerMetadataIndicateur = api.metadataIndicateur.creer.useMutation({
    onSuccess: () => {
      router.push(`${indicateur.indicId}`);
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre : error.message,
        });
      }
    },
  });

  const creerIndicateur: SubmitHandler<MetadataIndicateurForm & { indicId: string }> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
      indicParentIndic: data.indicParentIndic === 'Aucun indicateur selectionné' ? null : data.indicParentIndic,
    };

    mutationCreerMetadataIndicateur.mutate(inputs);
  };

  const modifierIndicateur: SubmitHandler<MetadataIndicateurForm & { indicId: string }> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie('csrf') ?? '',
      ...data,
      indicParentIndic: data.indicParentIndic === 'Aucun indicateur selectionné' ? null : data.indicParentIndic,
    };

    mutationModifierMetadataIndicateur.mutate(inputs);
  };

  return {
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    modifierIndicateur,
    creerIndicateur,
    reactHookForm,
    alerte,
  };
};
