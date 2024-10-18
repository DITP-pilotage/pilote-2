import { useFormContext, UseFormWatch } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { UtilisateurFormInputs } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import api from '@/server/infrastructure/api/trpc/api';
import { ProfilCode, profilsDépartementaux, profilsRégionaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from '@/client/utils/arrays';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

function activerWatchSurSelecteur(watch: UseFormWatch<UtilisateurFormInputs>) {
  watch('profil');
}

export const AAccesATousLesUtilisateurs = (profil: Profil | null) => {
  if (profil)
    return profil.utilisateurs.tousChantiers && profil.utilisateurs.tousTerritoires;

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

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
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

  const listeProfils = [ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.COORDINATEUR_REGION].includes(session!.profil) ?
    profils?.filter(profil => PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION[session?.profil as keyof typeof PROFILS_POSSIBLES_COORDINATEURS_MODIFICATION].includes(profil.code)) :
    profils;
  const optionsProfil =  listeProfils ? listeProfils.map(profil => ({ libellé: profil.nom, valeur: profil.code })) : [];
  const profilCodeSelectionne = getValues('profil');
  const profilSelectionne = profils?.find(profil => profil.code === profilCodeSelectionne);
  const ChangementProfilSelectionne = (profilCode: ProfilCode) => {
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
  const activerLaRestrictionDesTerritoires = ![ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session!.profil);
  const groupesTerritoiresÀAfficher = {
    nationale: false,
    régionale: afficherChampLectureTerritoires && profilsRégionaux.includes(profilCodeSelectionne),
    départementale: afficherChampLectureTerritoires && profilsDépartementaux.includes(profilCodeSelectionne),
  };
  const territoiresSélectionnables = session?.habilitations.gestionUtilisateur.territoires;

  const afficherChampLectureChantiers = profilSelectionne && !profilSelectionne.chantiers.lecture.tous && !profilSelectionne.chantiers.lecture.tousTerritorialisés;
  let chantiersAccessiblesLecture = chantiers?.filter(chantier => session?.habilitations.gestionUtilisateur.chantiers.includes(chantier.id));
  if ([ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.SERVICES_DECONCENTRES_REGION].includes(profilCodeSelectionne)) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(chantier => chantier.estTerritorialisé);
  } 
  if (!profilSelectionne?.chantiers.lecture.brouillons) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(chantier => chantier.statut !== 'BROUILLON');
  }
  const ChangementChantiersSelectionnes = (valeursSelectionnees: string[]) => {
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
  const ChangementPerimetresSelectionnes = (valeursSelectionnees: string[]) => {
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
  let chantiersAccessibleResponsabilite: ChantierSynthétisé[];
  if (!afficherChampResponsabiliteChantiers) {
    chantiersAccessibleResponsabilite = [];
  } else if (afficherChampLectureChantiers) {
    chantiersAccessibleResponsabilite = chantiersAccessiblesLecture?.filter(chantier => watch('habilitations.lecture.chantiers').includes(chantier.id)) ?? [];
  } else {
    chantiersAccessibleResponsabilite = chantiersAccessiblesLecture ?? [];
  }

  const afficherChampSaisieIndicateur = profilSelectionne && !profilSelectionne.chantiers.lecture.tous && profilSelectionne.chantiers.saisieIndicateur.tousTerritoires;
  const afficherChampSaisieCommentaire = profilSelectionne && !profilSelectionne.chantiers.lecture.tous;
  const afficherChampGestionCompte = profilSelectionne && profilSelectionne.utilisateurs.modificationPossible && !AAccesATousLesUtilisateurs(profilSelectionne);

  activerWatchSurSelecteur(watch);

  return {
    register,
    control,
    getValues,
    setValue,
    errors,
    optionsProfil,
    profilCodeSelectionne,
    ChangementProfilSelectionne,
    afficherChampLectureTerritoires,
    activerLaRestrictionDesTerritoires,
    groupesTerritoiresÀAfficher,
    territoiresSélectionnables,
    afficherChampLecturePérimètres,
    ChangementPerimetresSelectionnes,
    afficherChampLectureChantiers,
    chantiersAccessiblesLecture,
    chantiersIdsAppartenantsAuxPerimetresSelectionnes,
    ChangementChantiersSelectionnes,
    afficherChampResponsabiliteChantiers,
    chantiersAccessibleResponsabilite,
    afficherChampSaisieIndicateur,
    afficherChampSaisieCommentaire,
    afficherChampGestionCompte,
  };
}
