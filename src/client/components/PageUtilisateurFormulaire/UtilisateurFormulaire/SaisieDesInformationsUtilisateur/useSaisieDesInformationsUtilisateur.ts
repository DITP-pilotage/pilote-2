import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import api from '@/server/infrastructure/api/trpc/api';
import { ProfilCode, profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export const AAccesATousLesUtilisateurs = (profil: Profil | null) => {
  if (profil) {
    return profil.utilisateurs.tousChantiers && profil.utilisateurs.tousTerritoires;
  }

  return false;
};

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

function utilisateurEstCoordinateur(profilCode: ProfilCode) {
  return [ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.COORDINATEUR_REGION].includes(profilCode);
}

function profilsPeutEtreCreeParUnCoordinateur(profilCodeCreateur: ProfilCode, profilCode: ProfilCode) {
  return PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION[profilCodeCreateur as keyof typeof PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION].includes(profilCode);
}

function AAccesUniquementAuxChantiersTerritorialises(profilCodeSelectionne: ProfilCode) {
  return [ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.SERVICES_DECONCENTRES_REGION].includes(profilCodeSelectionne);
}

function AAccesATousLesTerritoires(profilCode: ProfilCode) {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profilCode);
}

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: territoires } = api.territoire.récupérerListe.useQuery({ territoireCodes: null }, { staleTime: Number.POSITIVE_INFINITY });
  const { data: session } = useSession();
  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<UtilisateurFormInputs>();

  const [chantiersIdsAppartenantsAuxPerimetresSelectionnes, setChantiersIdsAppartenantsAuxPerimetresSelectionnes] = useState<string[]>([]);
  const [chantiersApplicablesPourLesTerrioiresSelectionnes, setChantiersApplicablesPourLesTerrioiresSelectionnes] = useState<Set<string>>(new Set());

  const listeProfils = utilisateurEstCoordinateur(session!.profil) ?
    profils?.filter(profil => profilsPeutEtreCreeParUnCoordinateur(session!.profil, profil.code)) :
    profils;
  const optionsProfil =  listeProfils ? listeProfils.map(profil => ({ libellé: profil.nom, valeur: profil.code })) : [];
  const profilCodeSelectionne = getValues('profil');
  const profilSelectionne = profils?.find(profil => profil.code === profilCodeSelectionne);
  const changementProfilSelectionne = (profilCode: ProfilCode) => {
    const profilUtilisateur = profils?.find(profil => profil.code === profilCode);
    const valeurDefautSaisieCommentaire = profilUtilisateur?.chantiers.saisieCommentaire.saisiePossible ?
      profilUtilisateur.chantiers.lecture.tous :
      false;
    const valeurDefautSaisieIndicateur = profilUtilisateur?.chantiers.saisieIndicateur.tousTerritoires ?
      profilUtilisateur.chantiers.lecture.tous :
      false;
    const valeurDefautGestionUtilisateur = profilUtilisateur?.utilisateurs.modificationPossible ? 
      AAccesATousLesUtilisateurs(profilUtilisateur) : 
      false;

    setValue('profil', profilCode);
    setValue('habilitations.lecture.territoires', []);
    setValue('habilitations.lecture.périmètres', []);
    setValue('habilitations.lecture.chantiers', []);
    setValue('habilitations.responsabilite.chantiers', []);
    setValue('gestionUtilisateur', valeurDefautGestionUtilisateur);
    setValue('saisieIndicateur', valeurDefautSaisieIndicateur);
    setValue('saisieCommentaire', valeurDefautSaisieCommentaire);
  };

  const afficherChampLectureTerritoires = (profilsDépartementaux.includes(profilCodeSelectionne) || profilsRégionaux.includes(profilCodeSelectionne));
  const activerLaRestrictionDesTerritoires = !AAccesATousLesTerritoires(session!.profil);
  const groupesTerritoiresÀAfficher = {
    nationale: false,
    régionale: afficherChampLectureTerritoires && profilsRégionaux.includes(profilCodeSelectionne),
    départementale: afficherChampLectureTerritoires && profilsDépartementaux.includes(profilCodeSelectionne),
  };
  const territoiresSélectionnables = session?.habilitations.gestionUtilisateur.territoires;
  const changementTerritoiresSelectionnes = (valeursSelectionnees: string[]) => {
    const territoiresEnfants = territoires?.
      filter(territoire => valeursSelectionnees.includes(territoire.codeParent ?? '')).
      map(territoire => territoire.code) ?? [];
    const listeTerritoiresProfil = new Set([...valeursSelectionnees, ...territoiresEnfants]);
    const chantiersIdSelectionnes = getValues('habilitations.lecture.chantiers');

    if (listeTerritoiresProfil.size > 0) {
      const chantiersApplicablesIds = new Set(chantiers?.
        filter(chantier => chantier.territoiresApplicables.some(chantierApplicable => listeTerritoiresProfil.has(chantierApplicable))).
        map(chantier => chantier.id));
      setChantiersApplicablesPourLesTerrioiresSelectionnes(chantiersApplicablesIds);
      setValue('habilitations.lecture.chantiers', chantiersIdSelectionnes?.filter(chantierId => chantiersApplicablesIds.has(chantierId)));
    } else {
      setChantiersApplicablesPourLesTerrioiresSelectionnes(new Set(chantiers?.map(chantier => chantier.id)));
    }
    
    setValue('habilitations.lecture.territoires', valeursSelectionnees);
  };

  const afficherChampLectureChantiers = profilSelectionne && !profilSelectionne.chantiers.lecture.tous && !profilSelectionne.chantiers.lecture.tousTerritorialisés;
  let chantiersAccessiblesLecture = chantiers?.filter(chantier => session?.habilitations.gestionUtilisateur.chantiers.includes(chantier.id));
  if (AAccesUniquementAuxChantiersTerritorialises(profilCodeSelectionne)) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(chantier => chantier.estTerritorialisé && chantiersApplicablesPourLesTerrioiresSelectionnes.has(chantier.id));
  } 
  if (!profilSelectionne?.chantiers.lecture.brouillons) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(chantier => chantier.statut !== 'BROUILLON');
  }
  const changementChantiersSelectionnes = (valeursSelectionnees: string[]) => {
    const chantiersIdsResponsabilite = getValues('habilitations.responsabilite.chantiers') ?? [];

    setValue('habilitations.lecture.chantiers', valeursSelectionnees);
    setValue('habilitations.responsabilite.chantiers', chantiersIdsResponsabilite.filter(chantierId => valeursSelectionnees.includes(chantierId)));
  };
  
  const afficherChampLecturePérimètres = profilSelectionne && !profilSelectionne.chantiers.lecture.tous && !profilSelectionne.chantiers.lecture.tousTerritorialisés;
  const recupererChantiersIdsAPartirDesPerimetres = (listePerimetresIds: string[]) => {
    return chantiersAccessiblesLecture?.
      filter(chantier => auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(chantier.périmètreIds, listePerimetresIds)).
      map(chantier => chantier.id) ?? [];
  };
  const changementPerimetresSelectionnes = (valeursSelectionnees: string[]) => {
    const perimetresIdsActuellementsSelectionnes = getValues('habilitations.lecture.périmètres') ?? [];
    const perimetresIdsDecoches = perimetresIdsActuellementsSelectionnes.filter(perimetreId => !valeursSelectionnees.includes(perimetreId));
    const chantiersIdsDesPerimetresDecoches = recupererChantiersIdsAPartirDesPerimetres(perimetresIdsDecoches);
    const chantiersIdsDesPerimetres = recupererChantiersIdsAPartirDesPerimetres(valeursSelectionnees);
    const chantiersIdsSelectionnes = getValues('habilitations.lecture.chantiers') ?? [];
    const nouveauxChantiersIds = chantiersIdsSelectionnes.filter(chantierId => !chantiersIdsDesPerimetresDecoches.includes(chantierId));
    const chantiersIdsResponsabiliteSelectionnes = getValues('habilitations.responsabilite.chantiers') ?? [];
    const nouveauxChantiersIdsResponsabilite = chantiersIdsResponsabiliteSelectionnes.filter(chantierId => !chantiersIdsDesPerimetresDecoches.includes(chantierId));

    setChantiersIdsAppartenantsAuxPerimetresSelectionnes(chantiersIdsDesPerimetres ?? []);
    setValue('habilitations.lecture.chantiers', [...new Set([...(chantiersIdsDesPerimetres ?? []), ...nouveauxChantiersIds])]);
    setValue('habilitations.lecture.périmètres', valeursSelectionnees);
    setValue('habilitations.responsabilite.chantiers', nouveauxChantiersIdsResponsabilite);
  };

  const afficherChampResponsabiliteChantiers = PROFILS_POSSIBLES_RESPONSABLES.has(profilCodeSelectionne);
  let chantiersAccessibleResponsabilite: ChantierSynthétisé[] = 
  !afficherChampResponsabiliteChantiers 
    ? [] 
    : afficherChampLectureChantiers 
      ? chantiersAccessiblesLecture?.filter(chantier => watch('habilitations.lecture.chantiers').includes(chantier.id)) ?? [] 
      : chantiersAccessiblesLecture ?? [];

  const afficherChampSaisieIndicateur = profilSelectionne && !profilSelectionne.chantiers.lecture.tous && profilSelectionne.chantiers.saisieIndicateur.tousTerritoires;
  const afficherChampSaisieCommentaire = profilSelectionne && !profilSelectionne.chantiers.lecture.tous;
  const afficherChampGestionCompte = profilSelectionne && profilSelectionne.utilisateurs.modificationPossible && !AAccesATousLesUtilisateurs(profilSelectionne);

  watch('profil');

  return {
    register,
    control,
    getValues,
    setValue,
    errors,
    optionsProfil,
    profilCodeSelectionne,
    changementProfilSelectionne,
    afficherChampLectureTerritoires,
    activerLaRestrictionDesTerritoires,
    groupesTerritoiresÀAfficher,
    territoiresSélectionnables,
    changementTerritoiresSelectionnes,
    afficherChampLecturePérimètres,
    changementPerimetresSelectionnes,
    afficherChampLectureChantiers,
    chantiersAccessiblesLecture,
    chantiersIdsAppartenantsAuxPerimetresSelectionnes,
    changementChantiersSelectionnes,
    afficherChampResponsabiliteChantiers,
    chantiersAccessibleResponsabilite,
    afficherChampSaisieIndicateur,
    afficherChampSaisieCommentaire,
    afficherChampGestionCompte,
  };
}
