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
& MetadataSelectionIndicateurForm
& MetadataParametrageParametrePonderationIndicateurForm
& MetadataParametrageAutresIndicateurForm;

export const usePageIndicateur = (indicateur: MetadataParametrageIndicateurContrat) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const [estEnCoursDeModification, setEstEnCoursDeModification] = useState<boolean>(false);

  const reactHookForm = useForm<MetadataIndicateurForm>(
    {
      resolver: zodResolver(validationMetadataIndicateurFormulaire),
      defaultValues: {
        ...indicateur,
        indicHiddenPilote: indicateur.indicHiddenPilote ? 'false' : 'true',
        indicIsBaro: indicateur.indicIsBaro,
        indicIsPhare: indicateur.indicIsPhare,
        indicIsPerseverant: indicateur.indicIsPerseverant,
        indicTerritorialise: indicateur.indicTerritorialise,
        donneeOuverte: indicateur.donneeOuverte,
        projetAnnuelPerf: indicateur.projetAnnuelPerf,
        poidsPourcentNat: `${indicateur.poidsPourcentNat}`,
        poidsPourcentReg: `${indicateur.poidsPourcentReg}`,
        poidsPourcentDept: `${indicateur.poidsPourcentDept}`,
        zgApplicable: indicateur.zgApplicable || '',
        delaiDisponibilite: `${indicateur.delaiDisponibilite}`,
        frequenceTerritoriale: `${indicateur.frequenceTerritoriale}`,
        indicParentIndic: indicateur.indicParentIndic === null ? 'Aucun indicateur selectionné' : indicateur.indicParentIndic,
        indicParentCh: indicateur.indicParentCh ?? '_',
      },
    },
  );


  const mutationModifierMetadataIndicateur = api.metadataIndicateur.modifier.useMutation({
    onSuccess: () => {
      setEstEnCoursDeModification(false);
      router.push(`/admin/indicateurs/${indicateur.indicId}?_action=modification-reussie`);
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre: error.message,
        });
      }
    },
  });
  const mutationCreerMetadataIndicateur = api.metadataIndicateur.creer.useMutation({
    onSuccess: () => {
      setEstEnCoursDeModification(false);
      router.push(`/admin/indicateurs/${indicateur.indicId}?_action=creation-reussie`);
    },
    onError: error => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          titre: error.message,
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

  const reinitialiserIndicateur = () => {
    reactHookForm.reset();
    setEstEnCoursDeModification(false);
  };

  return {
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    modifierIndicateur,
    creerIndicateur,
    reactHookForm,
    alerte,
    reinitialiserIndicateur,
  };
};
