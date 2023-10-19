/* eslint-disable unicorn/no-useless-undefined */
import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UtilisateurFormInputs, UtilisateurFormulaireProps } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default function useSaisieDesInformationsUtilisateur(
  profilSélectionné: Profil | undefined,
  chantiersSélectionnables: ChantierSynthétisé[],
  utilisateur?: UtilisateurFormulaireProps['utilisateur'],
) {
  const { watch, setValue, getValues, resetField, unregister } = useFormContext<UtilisateurFormInputs>();
  const profilCodeSélectionné = watch('profil');
  const territoiresSélectionnésSaisieCommentaire = watch('habilitations.saisie.commentaire.territoires');
  const chantiersSélectionnésSaisieCommentaire = watch('habilitations.saisie.commentaire.chantiers');
  const périmètresMinistérielsSélectionnésSaisieCommentaire = watch('habilitations.saisie.commentaire.périmètres');

  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire] = useState<string[]>([]);

  const [afficherChampSaisieCommentaireTerritoires, setAfficherChampSaisieCommentaireTerritoires] = useState(false);
  const [afficherChampSaisieCommentaireChantiers, setAfficherChampSaisieCommentaireChantiers] = useState(false);
  const [afficherChampSaisieCommentairePérimètres, setAfficherChampSaisieCommentairePérimètres] = useState(false);

  // GESTION CHANGEMENT DE PROFIL
  useEffect(() => {
    setAfficherChampSaisieCommentaireTerritoires(!!profilSélectionné && (profilsDépartementaux.includes(profilSélectionné.code) || profilsRégionaux.includes(profilSélectionné.code)));
    setAfficherChampSaisieCommentaireChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && !profilSélectionné.chantiers.lecture.tousTerritorialisés);
    setAfficherChampSaisieCommentairePérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && !profilSélectionné.chantiers.lecture.tousTerritorialisés);
  }, [profilSélectionné]);

  // useEffect(() => {
  //   if (!chantiersSélectionnables || !profilSélectionné) return;
    
  //   if (profilSélectionné.code === 'SERVICES_DECONCENTRES_REGION' || profilSélectionné.code === 'SERVICES_DECONCENTRES_DEPARTEMENT') {
  //     setChantiersAccessiblesPourLeProfil(chantiersSélectionnables.filter(chantiersSélectionnables => chantiersSélectionnables.estTerritorialisé));
  //   } else {
  //     setChantiersAccessiblesPourLeProfil(chantiersSélectionnables);
  //   }
  // }, [chantiersSélectionnables, profilSélectionné]);

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      resetField('habilitations.saisie.commentaire.chantiers', { defaultValue: [] });
      resetField('habilitations.saisie.commentaire.territoires', { defaultValue: [] });
      resetField('habilitations.saisie.commentaire.périmètres', { defaultValue: [] });

      if (ancienProfilCodeSélectionné === undefined) {
        if (utilisateur?.habilitations?.lecture.chantiers) 
          setValue('habilitations.saisie.commentaire.chantiers', utilisateur?.habilitations?.lecture.chantiers);
      
        if (utilisateur?.habilitations?.lecture.territoires) 
          setValue('habilitations.saisie.commentaire.territoires', utilisateur?.habilitations?.lecture.territoires);

        if (utilisateur?.habilitations?.lecture.périmètres) 
          setValue('habilitations.saisie.commentaire.périmètres', utilisateur?.habilitations?.lecture.périmètres);
      }

      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }
  }, [ancienProfilCodeSélectionné, profilCodeSélectionné, resetField, setValue, unregister, utilisateur]);


  // GESTION CHANTIERS ET PERIMETRES MINISTERIELS 
  const déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels = useCallback((périmètresMinistérielsIdsSélectionnés: string[]) => {
    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiersSélectionnables.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));

    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiersSélectionnables]);

  const handleChangementValeursSélectionnéesChantiersSaisieCommentaire = useCallback((valeursSélectionnées: string[]) => {    
    setValue('habilitations.saisie.commentaire.chantiers', valeursSélectionnées);
  }, [setValue]);

  const handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire = useCallback((valeursSélectionnées: string[]) => {  
    const périmètresIdsActuellementsSélectionnés = getValues('habilitations.saisie.commentaire.périmètres') ?? [];
    const périmètresIdsDécochés = périmètresIdsActuellementsSélectionnés.filter(périmètreId => !valeursSélectionnées.includes(périmètreId));
    const chantiersIdsDesPérimètresDécochés = déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(périmètresIdsDécochés);
    const chantiersIdsActuellementSélectionnés = getValues('habilitations.saisie.commentaire.chantiers') ?? [];
    const nouveauChantiersIds = chantiersIdsActuellementSélectionnés.filter(chantierId => !chantiersIdsDesPérimètresDécochés.includes(chantierId));
    setValue('habilitations.saisie.commentaire.chantiers', nouveauChantiersIds);
    setValue('habilitations.saisie.commentaire.périmètres', valeursSélectionnées);
    setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire(déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels(valeursSélectionnées));
  }, [déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels, getValues, setValue]);

  useEffect(() => {
    handleChangementValeursSélectionnéesChantiersSaisieCommentaire([...getValues('habilitations.saisie.commentaire.chantiers') ?? [], ...chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire]);
  }, [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire, getValues, handleChangementValeursSélectionnéesChantiersSaisieCommentaire]); 

  useEffect(() => {
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire(getValues('habilitations.saisie.commentaire.périmètres'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersSélectionnables]);

  const handleChangementValeursSélectionnéesTerritoiresSaisieCommentaire = useCallback((valeursSélectionnées: string[]) => {
    setValue('habilitations.saisie.commentaire.territoires', valeursSélectionnées);
  }, [setValue]);


  return {
    handleChangementValeursSélectionnéesTerritoiresSaisieCommentaire,
    handleChangementValeursSélectionnéesChantiersSaisieCommentaire,
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire,
    afficherChampSaisieCommentaireTerritoires,
    afficherChampSaisieCommentaireChantiers,
    afficherChampSaisieCommentairePérimètres,
    territoiresSélectionnésSaisieCommentaire,
    chantiersSélectionnésSaisieCommentaire,
    périmètresMinistérielsSélectionnésSaisieCommentaire,
  };
}
