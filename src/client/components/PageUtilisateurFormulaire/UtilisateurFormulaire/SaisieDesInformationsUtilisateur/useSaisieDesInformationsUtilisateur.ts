import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import {
  UtilisateurFormInputs,
  UtilisateurFormulaireProps,
} from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

export const PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION = {
  COORDINATEUR_REGION: [
    ProfilEnum.PREFET_REGION,
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
  COORDINATEUR_DEPARTEMENT: [
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
};

export const PROFILS_POSSIBLES_COORDINATEURS_LECTURE = {
  COORDINATEUR_REGION: [
    ProfilEnum.PREFET_REGION,
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_REGION,
  ],
  COORDINATEUR_DEPARTEMENT: [
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ],
};

export const PROFILS_POSSIBLES_RESPONSABLES = new Set([
  ProfilEnum.PREFET_REGION,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.COORDINATEUR_REGION,  
  ProfilEnum.EQUIPE_DIR_PROJET,
]);

export const AAccesATousLesUtilisateurs = (profil: Profil | null) => {
  if (profil)
    return profil.utilisateurs.tousChantiers && profil.utilisateurs.tousTerritoires;

  return false;
};

export default function useSaisieDesInformationsUtilisateur(utilisateur?: UtilisateurFormulaireProps['utilisateur']) {
  const { data: session } = useSession();
  const { register, watch, formState: { errors }, control, setValue, getValues, resetField } = useFormContext<UtilisateurFormInputs>();
  const profilCodeSélectionné = watch('profil');
  const territoiresSélectionnés = watch('habilitations.lecture.territoires');
  const chantiersSélectionnés = watch('habilitations.lecture.chantiers');
  const chantiersSélectionnésResponsabilite = watch('habilitations.responsabilite.chantiers');
  const périmètresMinistérielsSélectionnés = watch('habilitations.lecture.périmètres');

  const [chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, setChantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés] = useState<string[]>([]);
  const [profilSélectionné, setProfilSélectionné] = useState<Profil | undefined>();
  const [listeProfils, setListeProfils] = useState<{ libellé: string, valeur: string }[]>([]);
  const [afficherChampLectureTerritoires, setAfficherChampLectureTerritoires] = useState(false);
  const [afficherChampLectureChantiers, setAfficherChampLectureChantiers] = useState(false);
  const [afficherChampResponsabiliteChantiers, setAfficherChampResponsabiliteChantiers] = useState(false);
  const [afficherChampLecturePérimètres, setAfficherChampLecturePérimètres] = useState(false);
  const [afficherChampSaisieCommentaire, setAfficherChampSaisieCommentaire] = useState(false);
  const [afficherChampSaisieIndicateur, setAfficherChampSaisieIndicateur] = useState(false);
  const [afficherChampGestionCompte, setAfficherChampGestionCompte] = useState(false);

  const [chantiersAccessiblesPourLeProfil, setChantiersAccessiblesPourLeProfil] = useState<ChantierSynthétisé[]>([]);
  const [chantiersAccessibleResponsabilite, setChantiersAccessibleResponsabilite] = useState<ChantierSynthétisé[]>([]);

  

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

  const handleChangementValeursSélectionnéesChantiersResponsabilite = useCallback((valeursSélectionnées: string[]) => {    
    setValue('habilitations.responsabilite.chantiers', valeursSélectionnées);
  }, [setValue]);

  useEffect(() => {
    // Lecture
    setAfficherChampLectureTerritoires(!!profilSélectionné && (profilsDépartementaux.includes(profilSélectionné.code) || profilsRégionaux.includes(profilSélectionné.code)));
    setAfficherChampLectureChantiers(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && !profilSélectionné.chantiers.lecture.tousTerritorialisés);
    setAfficherChampResponsabiliteChantiers(!!profilCodeSélectionné && PROFILS_POSSIBLES_RESPONSABLES.has(profilCodeSélectionné));

    if ([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session!.profil)) {
      setAfficherChampLecturePérimètres(!!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && !profilSélectionné.chantiers.lecture.tousTerritorialisés);
    } else {
      setAfficherChampLecturePérimètres(false);
    }

    const afficherChoixCommentaire = !!profilSélectionné && !profilSélectionné.chantiers.lecture.tous;
    setAfficherChampSaisieCommentaire(afficherChoixCommentaire);

    const afficherChoixIndicateur = !!profilSélectionné && !profilSélectionné.chantiers.lecture.tous && profilSélectionné.chantiers.saisieIndicateur.tousTerritoires;
    setAfficherChampSaisieIndicateur(afficherChoixIndicateur);

    const afficherGestionCompte = !!profilSélectionné && profilSélectionné.utilisateurs.modificationPossible && !AAccesATousLesUtilisateurs(profilSélectionné);
    setAfficherChampGestionCompte(afficherGestionCompte);

    if (!utilisateur) {
      // Saisie Commentaire
      const valeurParDéfautCaseCommentaire = afficherChoixCommentaire ? false : !!profilSélectionné?.chantiers.saisieCommentaire.saisiePossible;
      setValue('saisieCommentaire', valeurParDéfautCaseCommentaire);
  
      // Saisie Indicateur
      const valeurParDéfautCaseIndicateur = afficherChoixIndicateur ? false : !!profilSélectionné?.chantiers.saisieIndicateur.tousTerritoires;
      setValue('saisieIndicateur', valeurParDéfautCaseIndicateur);

      // Gestion des comptes
      const valeurParDéfautCaseGestionCompte = afficherGestionCompte ? false : AAccesATousLesUtilisateurs(profilSélectionné ?? null);
      setValue('gestionUtilisateur', valeurParDéfautCaseGestionCompte);
    } else {
      setValue('saisieCommentaire', utilisateur.saisieCommentaire);
      setValue('saisieIndicateur', utilisateur.saisieIndicateur);
      setValue('gestionUtilisateur', utilisateur.gestionUtilisateur);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilCodeSélectionné, profilSélectionné, setValue, utilisateur]);

  useEffect(() => {
    if (!chantiers || !profilSélectionné) return;
    
    let chantiersAccessibles = chantiers.filter(chantier => session?.habilitations.gestionUtilisateur.chantiers.includes(chantier.id));

    if ([ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.SERVICES_DECONCENTRES_REGION].includes(profilSélectionné.code)) {
      chantiersAccessibles = chantiersAccessibles.filter(chantier => chantier.estTerritorialisé);
    } 

    if (!profilSélectionné.chantiers.lecture.brouillons) {
      chantiersAccessibles = chantiersAccessibles.filter(chantier => chantier.statut !== 'BROUILLON');
    }

    setChantiersAccessiblesPourLeProfil(chantiersAccessibles);

  }, [chantiers, profilSélectionné, session]);

  useEffect(() => {
    if (utilisateur) {
      if (utilisateur.habilitations?.lecture.chantiers && afficherChampLectureChantiers && getValues('habilitations.lecture.chantiers')?.length === 0) 
        setValue('habilitations.lecture.chantiers', utilisateur.habilitations?.lecture.chantiers);
      
      if (utilisateur.habilitations?.lecture.territoires && afficherChampLectureTerritoires && getValues('habilitations.lecture.territoires')?.length === 0) 
        setValue('habilitations.lecture.territoires', utilisateur.habilitations?.lecture.territoires);

      if (utilisateur.habilitations?.lecture.périmètres && afficherChampLecturePérimètres && getValues('habilitations.lecture.périmètres')?.length === 0) 
        setValue('habilitations.lecture.périmètres', utilisateur.habilitations?.lecture.périmètres);

      if (utilisateur.habilitations?.responsabilite.chantiers && afficherChampResponsabiliteChantiers && getValues('habilitations.lecture.chantiers')?.length === 0) 
        setValue('habilitations.responsabilite.chantiers', utilisateur.habilitations?.responsabilite.chantiers);
    }
  }, [afficherChampLectureChantiers, afficherChampLecturePérimètres, afficherChampLectureTerritoires, profilCodeSélectionné, resetField, setValue, utilisateur, afficherChampResponsabiliteChantiers, getValues]);

  useEffect(() => {

    if (profils) {
      const profilAssociéAuProfilCodeSélectionné = profils.find(profil => profil.code === profilCodeSélectionné)!;
      setProfilSélectionné(profilAssociéAuProfilCodeSélectionné);
      let profilsFiltrés = profils;
      if ([ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.COORDINATEUR_REGION].includes(session!.profil)) {
        profilsFiltrés = profilsFiltrés.filter(profil => PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION[session?.profil as keyof typeof PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION].includes(profil.code));
      }
      setListeProfils(profilsFiltrés.map(profil => ({ libellé: profil.nom, valeur: profil.code })));
    }
  }, [profils, profilCodeSélectionné, session]);


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
  }, [getValues, handleChangementValeursSélectionnéesPérimètresMinistériels]);

  useEffect(() => {
    if (!afficherChampResponsabiliteChantiers) {
      setChantiersAccessibleResponsabilite([]);
    } else if (afficherChampLectureChantiers) {
      setChantiersAccessibleResponsabilite(chantiersAccessiblesPourLeProfil.filter(chantier => chantiersSélectionnés.includes(chantier.id)));
    } else {
      setChantiersAccessibleResponsabilite(chantiersAccessiblesPourLeProfil);
    }
  }, [afficherChampLectureChantiers, afficherChampResponsabiliteChantiers, chantiersAccessiblesPourLeProfil, chantiersSélectionnés]);
  

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
    chantiers,
    listeProfils,
    profilSélectionné,
    handleChangementValeursSélectionnéesTerritoires,
    handleChangementValeursSélectionnéesChantiers,
    handleChangementValeursSélectionnéesPérimètresMinistériels,
    handleChangementValeursSélectionnéesChantiersResponsabilite,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés,
    register,
    errors,
    control,
    getValues,
    afficherChampLectureTerritoires,
    afficherChampLectureChantiers,
    afficherChampLecturePérimètres,
    afficherChampResponsabiliteChantiers,
    territoiresSélectionnés,
    chantiersSélectionnés,
    chantiersSélectionnésResponsabilite,
    périmètresMinistérielsSélectionnés,
    groupesTerritoiresÀAfficher,
    chantiersAccessiblesPourLeProfil,
    chantiersAccessibleResponsabilite,
    afficherChampSaisieCommentaire,
    afficherChampSaisieIndicateur,
    afficherChampGestionCompte,
    session,
  };
}
