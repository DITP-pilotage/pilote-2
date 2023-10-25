/* eslint-disable unicorn/no-useless-undefined */
import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UtilisateurFormInputs, UtilisateurFormulaireProps } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { profilsDépartementaux, profilsRégionaux, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default function useSaisieDesInformationsUtilisateur(utilisateur?: UtilisateurFormulaireProps['utilisateur']) {
  const { register, watch, formState: { errors }, control, setValue, getValues, resetField, unregister } = useFormContext<UtilisateurFormInputs>();
  const profilCodeSélectionné = watch('profil');
  const territoiresSélectionnés = watch('habilitations.lecture.territoires');
  const chantiersSélectionnés = watch('habilitations.lecture.chantiers');
  const périmètresMinistérielsSélectionnés = watch('habilitations.lecture.périmètres');

  const [chantiersSynthétisésSélectionnés, setChantiersSynthétisésSélectionnés] = useState<ChantierSynthétisé[]>([]);

  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string | undefined>(undefined);
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés] = useState<string[]>([]);
  const [profilSélectionné, setProfilSélectionné] = useState<Profil | undefined>();
  const [listeProfils, setListeProfils] = useState<{ libellé: string, valeur: string }[]>([]);
  const [afficherChampLectureTerritoires, setAfficherChampLectureTerritoires] = useState(false);
  const [afficherChampLectureChantiers, setAfficherChampLectureChantiers] = useState(false);
  const [afficherChampLecturePérimètres, setAfficherChampLecturePérimètres] = useState(false);
  const [chantiersAccessiblesPourLeProfil, setChantiersAccessiblesPourLeProfil] = useState<ChantierSynthétisé[]>([]);
  const [groupesTerritoiresÀAfficher, setGroupesTerritoiresÀAfficher] = useState<{ nationale: boolean, régionale: boolean, départementale: boolean }>({
    nationale: false, 
    régionale: false, 
    départementale: false,
  });

  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  // GESTION CHANGEMENT DE PROFIL
  const handleChangementValeursSélectionnéesChantiers = useCallback((valeursSélectionnées: string[]) => {    
    setValue('habilitations.lecture.chantiers', valeursSélectionnées);
  }, [setValue]);

  useEffect(() => {
    setAfficherChampLectureTerritoires(!!profilSélectionné && (profilsDépartementaux.includes(profilSélectionné.code) || profilsRégionaux.includes(profilSélectionné.code)));
    setAfficherChampLectureChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous);
    setAfficherChampLecturePérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous);
  }, [profilSélectionné]);

  useEffect(() => {
    if (!chantiers || !profilSélectionné) return;
    
    if (profilsTerritoriaux.includes(profilSélectionné.code)) {
      setChantiersAccessiblesPourLeProfil(chantiers.filter(chantier => chantier.estTerritorialisé));
    } else {
      setChantiersAccessiblesPourLeProfil(chantiers);
    }
  }, [chantiers, profilSélectionné]);

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      resetField('habilitations.lecture.chantiers', { defaultValue: [] });
      resetField('habilitations.lecture.territoires', { defaultValue: [] });
      resetField('habilitations.lecture.périmètres', { defaultValue: [] });

      if (utilisateur) {
        if (utilisateur.habilitations?.lecture.chantiers) 
          setValue('habilitations.lecture.chantiers', utilisateur.habilitations?.lecture.chantiers);
      
        if (utilisateur.habilitations?.lecture.territoires) 
          setValue('habilitations.lecture.territoires', utilisateur.habilitations?.lecture.territoires);

        if (utilisateur.habilitations?.lecture.périmètres) 
          setValue('habilitations.lecture.périmètres', utilisateur.habilitations?.lecture.périmètres);
      } else {
        if (profils) {
          const profilAssociéAuProfilCodeSélectionné = profils.find(p => p.code === profilCodeSélectionné);
          if (profilAssociéAuProfilCodeSélectionné?.chantiers.lecture.tousTerritorialisés) {
            if (chantiersAccessiblesPourLeProfil.length === 0 && chantiers) {
              handleChangementValeursSélectionnéesChantiers(chantiers.filter(chantier => chantier.estTerritorialisé).map(c => c.id));
            } else {
              handleChangementValeursSélectionnéesChantiers(chantiersAccessiblesPourLeProfil.map(c => c.id));
            }            
          }
        }
      }

      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  }, [ancienProfilCodeSélectionné, profilCodeSélectionné, chantiersAccessiblesPourLeProfil, resetField, setValue, unregister, utilisateur, profils, handleChangementValeursSélectionnéesChantiers, chantiers]);

  useEffect(() => {
    if (profils) {
      const profilAssociéAuProfilCodeSélectionné = profils.find(p => p.code === profilCodeSélectionné)!;
      setProfilSélectionné(profilAssociéAuProfilCodeSélectionné);
      setListeProfils(profils.map(profil => ({ libellé: profil.nom, valeur: profil.code })));
    }
  }, [profils, profilCodeSélectionné]);


  // GESTION CHANTIERS ET PERIMETRES MINISTERIELS 
  const déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels = useCallback((périmètresMinistérielsIdsSélectionnés: string[]) => {
    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiersAccessiblesPourLeProfil.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));

    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiersAccessiblesPourLeProfil]);

  const handleChangementValeursSélectionnéesPérimètresMinistériels = useCallback((valeursSélectionnées: string[]) => {  
    const périmètresIdsActuellementsSélectionnés = getValues('habilitations.lecture.périmètres') ?? [];
    const périmètresIdsDécochés = périmètresIdsActuellementsSélectionnés.filter(périmètreId => !valeursSélectionnées.includes(périmètreId));
    const chantiersIdsDesPérimètresDécochés = déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(périmètresIdsDécochés);
    const chantiersIdsActuellementSélectionnés = getValues('habilitations.lecture.chantiers') ?? [];
    const nouveauChantiersIds = chantiersIdsActuellementSélectionnés.filter(chantierId => !chantiersIdsDesPérimètresDécochés.includes(chantierId));
    setValue('habilitations.lecture.chantiers', nouveauChantiersIds);
    setValue('habilitations.lecture.périmètres', valeursSélectionnées);
    setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés(déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(valeursSélectionnées));
  }, [déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels, getValues, setValue]);

  useEffect(() => {
    handleChangementValeursSélectionnéesChantiers([...getValues('habilitations.lecture.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés]);
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, getValues, handleChangementValeursSélectionnéesChantiers]); 

  useEffect(() => {
    handleChangementValeursSélectionnéesPérimètresMinistériels(getValues('habilitations.lecture.périmètres'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersAccessiblesPourLeProfil]);

  useEffect(() => {
    if (chantiersSélectionnés) {
      const chantiersSynthétisésListe = chantiers?.filter(chantier => chantiersSélectionnés.includes(chantier.id)) ?? [];  
      setChantiersSynthétisésSélectionnés(chantiersSynthétisésListe);
    }
  }, [chantiers, setChantiersSynthétisésSélectionnés, chantiersSélectionnés]);

  // GESTION DES TERRITOIRES
  useEffect(() => {
    if (!profilSélectionné) return;
    
    setGroupesTerritoiresÀAfficher({
      nationale: false,
      régionale: afficherChampLectureTerritoires && profilsRégionaux.includes(profilSélectionné.code),
      départementale: afficherChampLectureTerritoires && profilsDépartementaux.includes(profilSélectionné.code),
    });
  }, [afficherChampLectureTerritoires, profilSélectionné]);

  const handleChangementValeursSélectionnéesTerritoires = useCallback((valeursSélectionnées: string[]) => {
    setValue('habilitations.lecture.territoires', valeursSélectionnées);
  }, [setValue]);


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
    afficherChampLectureTerritoires,
    afficherChampLectureChantiers,
    afficherChampLecturePérimètres,
    territoiresSélectionnés,
    chantiersSélectionnés,
    périmètresMinistérielsSélectionnés,
    groupesTerritoiresÀAfficher,
    chantiersAccessiblesPourLeProfil,
    chantiersSynthétisésSélectionnés,
  };
}
