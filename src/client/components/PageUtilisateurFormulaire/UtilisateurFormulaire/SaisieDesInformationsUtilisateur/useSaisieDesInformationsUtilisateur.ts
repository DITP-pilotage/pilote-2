import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { HabilitationsÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import useHabilitationsTerritoires from './useHabilitationsTerritoires';

export default function useSaisieDesInformationsUtilisateur(profils: Profil[]) {
  const { register, watch, formState: { errors }, control, setValue, getValues } = useFormContext<UtilisateurFormInputs>();
  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const profilCodeSélectionné = watch('profil');
  const profilSélectionné = profils.find(p => p.code === profilCodeSélectionné)!;

  const { 
    déterminerLesTerritoiresSélectionnésParDéfaut, 
    déterminerLesTerritoiresSélectionnés,
  } = useHabilitationsTerritoires(profilSélectionné);

  const [habilitationsParDéfaut, setHabilitationsParDéfaut] = useState<HabilitationsÀCréerOuMettreÀJour>({
    lecture: {
      chantiers: [],
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

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      setHabilitationsParDéfaut(h => ({ ...h, 
        lecture: { 
          territoires: déterminerLesTerritoiresSélectionnésParDéfaut(), 
          chantiers: [], 
          périmètres: [], 
        }, 
      }));
      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [déterminerLesTerritoiresSélectionnésParDéfaut, profilCodeSélectionné]);


  return {
    listeProfils,
    habilitationsParDéfaut,
    profilSélectionné,
    handleChangementValeursSélectionnéesTerritoires,
    register,
    errors,
    control,
    getValues,
  };
}
