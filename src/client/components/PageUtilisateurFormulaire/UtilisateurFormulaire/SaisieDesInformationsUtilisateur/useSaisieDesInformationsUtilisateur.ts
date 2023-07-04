import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { Profil } from '@/server/domain/profil/Profil.interface';
import useHabilitationsTerritoires from './useHabilitationsTerritoires';
import useHabilitationsChantiers from './useHabilitationsChantiers';

export default function useSaisieDesInformationsUtilisateur() {
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  const { register, watch, formState: { errors }, control, setValue, getValues, unregister, resetField } = useFormContext<UtilisateurFormInputs>();
  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés] = useState<string[]>([]);
  const profilCodeSélectionné = watch('profil');
  const [profilSélectionné, setProfilSélectionné] = useState<Profil | undefined>();
  const [listeProfils, setListeProfils] = useState<{ libellé: string, valeur: string }[]>([]);

  useEffect(() => {
    if (profils) {
      const profilAssociéAuProfilCodeSélectionné = profils.find(p => p.code === profilCodeSélectionné)!;
      setProfilSélectionné(profilAssociéAuProfilCodeSélectionné);
      setListeProfils(profils.map(profil => ({ libellé: profil.nom, valeur: profil.code })));
    }
  }, [profils, profilCodeSélectionné]);

  const { déterminerLesTerritoiresSélectionnés, afficherChampLectureTerritoires } = useHabilitationsTerritoires(profilSélectionné);
  const { déterminerLesChantiersSélectionnés } = useHabilitationsChantiers(profilSélectionné);
  
  const handleChangementValeursSélectionnéesTerritoires = (valeursSélectionnées: string[]) => {    
    const territoiresSélectionnés = déterminerLesTerritoiresSélectionnés(valeursSélectionnées);
    setValue('habilitations.lecture.territoires', territoiresSélectionnés);
  };

  const handleChangementValeursSélectionnéesChantiers = (valeursSélectionnées: string[]) => {    
    setValue('habilitations.lecture.chantiers', valeursSélectionnées);
  };

  const handleChangementValeursSélectionnéesPérimètresMinistériels = useCallback((valeursSélectionnées: string[]) => {    
    const périmètresIdsActuellementsSélectionnés = getValues('habilitations.lecture.périmètres') ?? [];
    const périmètresIdsDécochés = périmètresIdsActuellementsSélectionnés.filter(périmètreId => !valeursSélectionnées.includes(périmètreId));
    const chantiersIdsDesPérimètresDécochés = déterminerLesChantiersSélectionnés(périmètresIdsDécochés);
    const chantiersIdsActuellementSélectionnés = getValues('habilitations.lecture.chantiers') ?? [];
    const nouveauChantiersIds = chantiersIdsActuellementSélectionnés.filter(chantierId => !chantiersIdsDesPérimètresDécochés.includes(chantierId));
    setValue('habilitations.lecture.chantiers', nouveauChantiersIds);
    setValue('habilitations.lecture.périmètres', valeursSélectionnées);
    setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés(déterminerLesChantiersSélectionnés(valeursSélectionnées));
  }, [déterminerLesChantiersSélectionnés, getValues, setValue]);

  useEffect(() => {
    if (!afficherChampLectureTerritoires) {
      // eslint-disable-next-line unicorn/no-useless-undefined
      resetField('habilitations.lecture.territoires');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afficherChampLectureTerritoires]);

  useEffect(() => {
    handleChangementValeursSélectionnéesChantiers([...getValues('habilitations.lecture.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés]);

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      unregister('habilitations.lecture');
      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilCodeSélectionné]);

  return {
    listeProfils,
    profilSélectionné,
    handleChangementValeursSélectionnéesTerritoires,
    handleChangementValeursSélectionnéesChantiers,
    handleChangementValeursSélectionnéesPérimètresMinistériels,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés,
    register,
    errors,
    control,
    getValues,
    watch,
  };
}
