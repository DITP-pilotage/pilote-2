import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import useHabilitationsTerritoires from './useHabilitationsTerritoires';
import useHabilitationsChantiers from './useHabilitationsChantiers';
import useHabilitationsPérimètresMinistériels from './useHabilitationsPérimètresMinistériels';

export default function useSaisieDesInformationsUtilisateur(profils: Profil[]) {
  const { register, watch, formState: { errors }, control, setValue, getValues } = useFormContext<UtilisateurFormInputs>();
  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés] = useState<string[]>([]);
  const profilCodeSélectionné = watch('profil');
  const profilSélectionné = profils.find(p => p.code === profilCodeSélectionné)!;

  const { 
    déterminerLesTerritoiresSélectionnésParDéfaut, 
    déterminerLesTerritoiresSélectionnés,
  } = useHabilitationsTerritoires(profilSélectionné);

  const { déterminerLesChantiersSélectionnésParDéfaut, déterminerLesChantiersSélectionnés } = useHabilitationsChantiers(profilSélectionné);
  const { déterminerLesPérimètresMinistérielsSélectionnésParDéfaut } = useHabilitationsPérimètresMinistériels(profilSélectionné);
  
  const listeProfils = profils.map(profil => ({
    libellé: profil.nom,
    valeur: profil.code,
  }));

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
    handleChangementValeursSélectionnéesChantiers([...getValues('habilitations.lecture.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés]);

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      setValue('habilitations.lecture.territoires', déterminerLesTerritoiresSélectionnésParDéfaut());
      setValue('habilitations.lecture.chantiers', déterminerLesChantiersSélectionnésParDéfaut());
      setValue('habilitations.lecture.périmètres', déterminerLesPérimètresMinistérielsSélectionnésParDéfaut());
      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [déterminerLesTerritoiresSélectionnésParDéfaut, profilCodeSélectionné, déterminerLesChantiersSélectionnésParDéfaut, déterminerLesPérimètresMinistérielsSélectionnésParDéfaut]);


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
