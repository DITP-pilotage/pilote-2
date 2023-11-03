/* eslint-disable unicorn/no-useless-undefined */
import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UtilisateurFormInputs, UtilisateurFormulaireProps } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function useSaisieDesInformationsUtilisateur(
  profilSélectionné: Profil | undefined,
  chantiersLecture: ChantierSynthétisé[],
  utilisateur?: UtilisateurFormulaireProps['utilisateur'],
) {
  const { watch, setValue, getValues, resetField, unregister } = useFormContext<UtilisateurFormInputs>();
  const profilCodeSélectionné = watch('profil');
  const chantiersSélectionnésSaisieCommentaire = watch('habilitations.saisie.commentaire.chantiers');
  const périmètresMinistérielsSélectionnésSaisieCommentaire = watch('habilitations.saisie.commentaire.périmètres');

  const [ancienProfilCodeSélectionné, setAncienProfilCodeSélectionné] = useState<string>(getValues('profil'));
  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire] = useState<string[]>([]);
  const [périmètresIdSélectionnablesSaisie, setPérimètresIdSélectionnablesSaisie] = useState<string[]>([]);

  const [afficherChampSaisieCommentaireChantiers, setAfficherChampSaisieCommentaireChantiers] = useState(false);
  const [afficherChampSaisieCommentairePérimètres, setAfficherChampSaisieCommentairePérimètres] = useState(false);
  const [chantiersAccessiblesPourLeProfilSaisieCommentaire, setChantiersAccessiblesPourLeProfilSaisieCommentaire] = useState<ChantierSynthétisé[]>([]);

  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  // GESTION CHANGEMENT DE PROFIL
  const handleChangementValeursSélectionnéesChantiersSaisieCommentaire = useCallback((valeursSélectionnées: string[]) => {    
    setValue('habilitations.saisie.commentaire.chantiers', valeursSélectionnées);
  }, [setValue]);

  useEffect(() => {
    setAfficherChampSaisieCommentaireChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous  && profilSélectionné.chantiers.saisieCommentaire.saisiePossible);
    setAfficherChampSaisieCommentairePérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieCommentaire.saisiePossible);
  }, [profilSélectionné]);

  useEffect(() => {
    if (!chantiers || !profilSélectionné) return;
    
    if (['RESPONSABLE_DEPARTEMENT', 'RESPONSABLE_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'SERVICES_DECONCENTRES_REGION'].includes(profilSélectionné.code)) {
      setChantiersAccessiblesPourLeProfilSaisieCommentaire(chantiersLecture.filter(chantier => chantier.estTerritorialisé && chantier.ate === 'hors_ate_deconcentre'));
    } else if (['REFERENT_DEPARTEMENT', 'REFERENT_REGION', 'PREFET_DEPARTEMENT', 'PREFET_REGION'].includes(profilSélectionné.code)) {
      setChantiersAccessiblesPourLeProfilSaisieCommentaire(chantiersLecture.filter(chantier => chantier.estTerritorialisé && chantier.ate === 'ate'));
    } else {
      setChantiersAccessiblesPourLeProfilSaisieCommentaire(chantiersLecture);
    }
  }, [chantiers, profilSélectionné, chantiersLecture]);

  useEffect(() => {
    if (!!!utilisateur && chantiersAccessiblesPourLeProfilSaisieCommentaire) {
      handleChangementValeursSélectionnéesChantiersSaisieCommentaire(chantiersAccessiblesPourLeProfilSaisieCommentaire.map(c => c.id));
  
      const périmètresListe = chantiersAccessiblesPourLeProfilSaisieCommentaire.flatMap(c => c.périmètreIds); 
      setPérimètresIdSélectionnablesSaisie([...new Set(périmètresListe)]);
    }
  }, [chantiers, chantiersAccessiblesPourLeProfilSaisieCommentaire, handleChangementValeursSélectionnéesChantiersSaisieCommentaire, utilisateur]);

  useEffect(() => {
    if (ancienProfilCodeSélectionné !== profilCodeSélectionné) {
      resetField('habilitations.saisie.commentaire.chantiers', { defaultValue: [] });
      resetField('habilitations.saisie.commentaire.périmètres', { defaultValue: [] });

      if (ancienProfilCodeSélectionné === undefined) {
        if (utilisateur?.habilitations?.lecture.chantiers) 
          setValue('habilitations.saisie.commentaire.chantiers', utilisateur?.habilitations?.['saisie.commentaire'].chantiers);
      
        if (utilisateur?.habilitations?.lecture.périmètres) 
          setValue('habilitations.saisie.commentaire.périmètres', utilisateur?.habilitations?.['saisie.commentaire'].périmètres);
      }

      setAncienProfilCodeSélectionné(profilCodeSélectionné);
    }

  }, [ancienProfilCodeSélectionné, profilCodeSélectionné, resetField, setValue, unregister, utilisateur, chantiersAccessiblesPourLeProfilSaisieCommentaire]);


  // GESTION CHANTIERS ET PERIMETRES MINISTERIELS 
  const déterminerChantiersSélectionnésÀPartirDesPérimètresMinistériels = useCallback((périmètresMinistérielsIdsSélectionnés: string[]) => {
    const chantiersAppartenantsAuPérimètresMinistérielsSélectionnés = chantiersAccessiblesPourLeProfilSaisieCommentaire.filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, périmètresMinistérielsIdsSélectionnés));

    return chantiersAppartenantsAuPérimètresMinistérielsSélectionnés.map(c => c.id);
  }, [chantiersAccessiblesPourLeProfilSaisieCommentaire]);

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
  }, [chantiersAccessiblesPourLeProfilSaisieCommentaire]);

  return {
    handleChangementValeursSélectionnéesChantiersSaisieCommentaire,
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire,
    afficherChampSaisieCommentaireChantiers,
    afficherChampSaisieCommentairePérimètres,
    chantiersSélectionnésSaisieCommentaire,
    périmètresMinistérielsSélectionnésSaisieCommentaire,
    chantiersAccessiblesPourLeProfilSaisieCommentaire,
    périmètresIdSélectionnablesSaisie,
  };
}
