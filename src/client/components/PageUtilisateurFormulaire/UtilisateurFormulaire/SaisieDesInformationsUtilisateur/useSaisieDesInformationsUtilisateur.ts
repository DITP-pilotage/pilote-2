import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { HabilitationsÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import useHabilitationsTerritoires from './useHabilitationsTerritoires';
import useHabilitationsChantiers from './useHabilitationsChantiers';

export default function useSaisieDesInformationsUtilisateur(profils: Profil[]) {
  const { register, watch, formState: { errors }, control, setValue, getValues } = useFormContext<UtilisateurFormInputs>();
  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const profilCodeSélectionné = watch('profil');
  const profilSélectionné = profils.find(p => p.code === profilCodeSélectionné)!;

  const { 
    déterminerLesTerritoiresSélectionnésParDéfaut, 
    déterminerLesTerritoiresSélectionnés,
  } = useHabilitationsTerritoires(profilSélectionné);

  const { déterminerLesChantiersSélectionnésParDéfaut } = useHabilitationsChantiers(profilSélectionné);

  const [habilitationsParDéfaut, setHabilitationsParDéfaut] = useState<HabilitationsÀCréerOuMettreÀJour>({
    lecture: {
      chantiers: getValues('habilitations.lecture.chantiers'),
      territoires: getValues('habilitations.lecture.territoires'),
      périmètres: [],
    },
    'saisie.commentaire': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  });

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

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      setHabilitationsParDéfaut(h => ({ ...h, 
        lecture: { 
          territoires: déterminerLesTerritoiresSélectionnésParDéfaut(), 
          chantiers: déterminerLesChantiersSélectionnésParDéfaut(), 
          périmètres: [], 
        }, 
      }));
      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [déterminerLesTerritoiresSélectionnésParDéfaut, profilCodeSélectionné, déterminerLesChantiersSélectionnésParDéfaut]);


  return {
    listeProfils,
    habilitationsParDéfaut,
    profilSélectionné,
    handleChangementValeursSélectionnéesTerritoires,
    handleChangementValeursSélectionnéesChantiers,
    register,
    errors,
    control,
    getValues,
  };
}
