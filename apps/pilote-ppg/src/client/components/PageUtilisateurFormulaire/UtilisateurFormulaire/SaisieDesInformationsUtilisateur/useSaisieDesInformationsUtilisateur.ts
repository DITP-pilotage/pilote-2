import { useFormContext } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { UtilisateurFormInputs } from "@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import api from "@/server/infrastructure/api/trpc/api";
import {
  ProfilCode,
  profilsDépartementaux,
  profilsRégionaux,
  profilsTerritoriaux,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { auMoinsUneValeurDuTableauEstContenueDansLAutreTableau } from "@/client/utils/arrays";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import {
  AAccesATousLesUtilisateurs,
  PROFILS_POSSIBLES_GESTION_UTILISATEUR_MODIFICATION,
  PROFILS_POSSIBLES_RESPONSABLES,
} from "@/server/domain/utilisateur/profils-gestion-utilisateur";

function utilisateurAAccesATousLesProfils(profilCode: ProfilCode) {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profilCode);
}

function profilsPeutEtreCreeParUtilisateur(
  profilCodeCreateur: ProfilCode,
  profilCode: ProfilCode,
) {
  return PROFILS_POSSIBLES_GESTION_UTILISATEUR_MODIFICATION[
    profilCodeCreateur as keyof typeof PROFILS_POSSIBLES_GESTION_UTILISATEUR_MODIFICATION
  ].includes(profilCode);
}

function AAccesUniquementAuxChantiersTerritorialises(
  profilCodeSelectionne: ProfilCode,
) {
  return profilsTerritoriaux.includes(profilCodeSelectionne);
}

function AAccesATousLesTerritoires(profilCode: ProfilCode) {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profilCode);
}

function ProfilNePeutPasDonnerDesAccesSurTousLesPerimetres(
  profilCode: ProfilCode,
) {
  return profilCode === "SECRETARIAT_GENERAL";
}

function PeutDonnerDesAccesSurDesPerimetre(profilCode: ProfilCode) {
  return ![
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_REGION,
  ].includes(profilCode);
}

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, {
    staleTime: Number.POSITIVE_INFINITY,
  });
  const { data: chantiers } =
    api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(
      undefined,
      { staleTime: Number.POSITIVE_INFINITY },
    );
  const { data: territoires } = api.territoire.récupérerListe.useQuery(
    { territoireCodes: null },
    { staleTime: Number.POSITIVE_INFINITY },
  );
  const { data: perimetresMinisteriels } =
    api.périmètreMinistériel.récupérerTous.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  const { data: session } = useSession();
  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<UtilisateurFormInputs>();

  const [
    chantiersIdsAppartenantsAuxPerimetresSelectionnes,
    setChantiersIdsAppartenantsAuxPerimetresSelectionnes,
  ] = useState<string[]>([]);
  const [
    chantiersApplicablesPourLesTerrioiresSelectionnes,
    setChantiersApplicablesPourLesTerrioiresSelectionnes,
  ] = useState<Set<string>>(new Set());

  const listeProfils = utilisateurAAccesATousLesProfils(session!.profil)
    ? profils
    : profils?.filter((profil) =>
        profilsPeutEtreCreeParUtilisateur(session!.profil, profil.code),
      );
  const optionsProfil = listeProfils
    ? listeProfils.map((profil) => ({
        libellé: profil.nom,
        valeur: profil.code,
      }))
    : [];
  const profilCodeSelectionne = getValues("profil");
  const profilSelectionne = profils?.find(
    (profil) => profil.code === profilCodeSelectionne,
  );
  const changementProfilSelectionne = (profilCode: ProfilCode) => {
    const profilUtilisateur = profils?.find(
      (profil) => profil.code === profilCode,
    );
    const valeurDefautSaisieIndicateur = profilUtilisateur?.chantiers
      .saisieIndicateur.tousTerritoires
      ? profilUtilisateur.chantiers.lecture.tous
      : false;
    const valeurDefautGestionUtilisateur = profilUtilisateur?.utilisateurs
      .modificationPossible
      ? AAccesATousLesUtilisateurs(profilUtilisateur)
      : false;

    setValue("profil", profilCode);
    setValue("habilitations.lecture.territoires", []);
    setValue("habilitations.lecture.périmètres", []);
    setValue("habilitations.lecture.chantiers", []);
    setValue("habilitations.responsabilite.chantiers", []);
    setValue("habilitations.saisieCommentaire.chantiers", []);
    setValue("gestionUtilisateur", valeurDefautGestionUtilisateur);
    setValue("saisieIndicateur", valeurDefautSaisieIndicateur);
  };

  const afficherChampLectureTerritoires =
    profilsDépartementaux.includes(profilCodeSelectionne) ||
    profilsRégionaux.includes(profilCodeSelectionne);
  const activerLaRestrictionDesTerritoires = !AAccesATousLesTerritoires(
    session!.profil,
  );
  const groupesTerritoiresÀAfficher = {
    nationale: false,
    regionale:
      afficherChampLectureTerritoires &&
      profilsRégionaux.includes(profilCodeSelectionne),
    departementale:
      afficherChampLectureTerritoires &&
      profilsDépartementaux.includes(profilCodeSelectionne),
  };
  const territoiresSélectionnables =
    session?.habilitations.gestionUtilisateur.territoires;
  const changementTerritoiresSelectionnes = (
    listeTerritoiresSelectionnes: string[],
  ) => {
    const territoiresEnfants =
      territoires
        ?.filter((territoire) =>
          listeTerritoiresSelectionnes.includes(territoire.codeParent ?? ""),
        )
        .map((territoire) => territoire.code) ?? [];
    const listeTerritoiresProfil = new Set([
      ...listeTerritoiresSelectionnes,
      ...territoiresEnfants,
    ]);
    const chantiersIdSelectionnes = getValues(
      "habilitations.lecture.chantiers",
    );

    if (listeTerritoiresProfil.size > 0) {
      const chantiersApplicablesIds = new Set(
        chantiers
          ?.filter((chantier) =>
            chantier.territoiresApplicables.some((territoireApplicable) =>
              listeTerritoiresProfil.has(territoireApplicable),
            ),
          )
          .map((chantier) => chantier.id),
      );
      setChantiersApplicablesPourLesTerrioiresSelectionnes(
        chantiersApplicablesIds,
      );
      setValue(
        "habilitations.lecture.chantiers",
        chantiersIdSelectionnes?.filter((chantierId) =>
          chantiersApplicablesIds.has(chantierId),
        ),
      );
    } else {
      setChantiersApplicablesPourLesTerrioiresSelectionnes(
        new Set(chantiers?.map((chantier) => chantier.id)),
      );
    }

    setValue("habilitations.lecture.territoires", listeTerritoiresSelectionnes);
  };

  const afficherChampLectureChantiers =
    profilSelectionne &&
    !profilSelectionne.chantiers.lecture.tous &&
    !profilSelectionne.chantiers.lecture.tousTerritorialisés;
  let chantiersAccessiblesLecture = chantiers?.filter((chantier) =>
    session?.habilitations.gestionUtilisateur.chantiers.includes(chantier.id),
  );
  if (AAccesUniquementAuxChantiersTerritorialises(profilCodeSelectionne)) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(
      (chantier) =>
        chantier.estTerritorialisé &&
        chantiersApplicablesPourLesTerrioiresSelectionnes.has(chantier.id),
    );
  }
  if (!profilSelectionne?.chantiers.lecture.brouillons) {
    chantiersAccessiblesLecture = chantiersAccessiblesLecture?.filter(
      (chantier) => chantier.statut !== "BROUILLON",
    );
  }
  const changementChantiersSelectionnes = (valeursSelectionnees: string[]) => {
    const chantiersIdsResponsabilite =
      getValues("habilitations.responsabilite.chantiers") ?? [];

    setValue("habilitations.lecture.chantiers", valeursSelectionnees);
    setValue(
      "habilitations.responsabilite.chantiers",
      chantiersIdsResponsabilite.filter((chantierId) =>
        valeursSelectionnees.includes(chantierId),
      ),
    );
  };

  const perimetresSelectionnables =
    (ProfilNePeutPasDonnerDesAccesSurTousLesPerimetres(session!.profil)
      ? perimetresMinisteriels?.filter((perimetre) =>
          session!.habilitations.gestionUtilisateur.périmètres.includes(
            perimetre.id,
          ),
        )
      : perimetresMinisteriels) ?? [];
  const afficherChampLecturePérimètres =
    PeutDonnerDesAccesSurDesPerimetre(session!.profil) &&
    profilSelectionne &&
    !profilSelectionne.chantiers.lecture.tous &&
    !profilSelectionne.chantiers.lecture.tousTerritorialisés;
  const recupererChantiersIdsAPartirDesPerimetres = (
    listePerimetresIds: string[],
  ) => {
    return (
      chantiersAccessiblesLecture
        ?.filter((chantier) =>
          auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(
            chantier.périmètreIds,
            listePerimetresIds,
          ),
        )
        .map((chantier) => chantier.id) ?? []
    );
  };
  const changementPerimetresSelectionnes = (valeursSelectionnees: string[]) => {
    const perimetresIdsActuellementsSelectionnes =
      getValues("habilitations.lecture.périmètres") ?? [];
    const perimetresIdsDecoches = perimetresIdsActuellementsSelectionnes.filter(
      (perimetreId) => !valeursSelectionnees.includes(perimetreId),
    );
    const chantiersIdsDesPerimetresDecoches =
      recupererChantiersIdsAPartirDesPerimetres(perimetresIdsDecoches);
    const chantiersIdsDesPerimetres =
      recupererChantiersIdsAPartirDesPerimetres(valeursSelectionnees);
    const chantiersIdsSelectionnes =
      getValues("habilitations.lecture.chantiers") ?? [];
    const nouveauxChantiersIds = chantiersIdsSelectionnes.filter(
      (chantierId) => !chantiersIdsDesPerimetresDecoches.includes(chantierId),
    );
    const chantiersIdsResponsabiliteSelectionnes =
      getValues("habilitations.responsabilite.chantiers") ?? [];
    const nouveauxChantiersIdsResponsabilite =
      chantiersIdsResponsabiliteSelectionnes.filter(
        (chantierId) => !chantiersIdsDesPerimetresDecoches.includes(chantierId),
      );

    setChantiersIdsAppartenantsAuxPerimetresSelectionnes(
      chantiersIdsDesPerimetres ?? [],
    );
    setValue("habilitations.lecture.chantiers", [
      ...new Set([
        ...(chantiersIdsDesPerimetres ?? []),
        ...nouveauxChantiersIds,
      ]),
    ]);
    setValue("habilitations.lecture.périmètres", valeursSelectionnees);
    setValue(
      "habilitations.responsabilite.chantiers",
      nouveauxChantiersIdsResponsabilite,
    );
  };

  const chantiersSelectionnesLecture: ChantierSynthétisé[] =
    afficherChampLectureChantiers
      ? (chantiersAccessiblesLecture?.filter((chantier) =>
          watch("habilitations.lecture.chantiers").includes(chantier.id),
        ) ?? [])
      : (chantiersAccessiblesLecture ?? []);

  const afficherChampResponsabiliteChantiers =
    PROFILS_POSSIBLES_RESPONSABLES.has(profilCodeSelectionne);
  const afficherChampSaisieIndicateur =
    profilSelectionne &&
    !profilSelectionne.chantiers.lecture.tous &&
    profilSelectionne.chantiers.saisieIndicateur.tousTerritoires;
  const afficherChampSaisieCommentaire =
    profilSelectionne && !profilSelectionne.chantiers.lecture.tous;
  const afficherChampGestionCompte =
    profilSelectionne &&
    profilSelectionne.utilisateurs.modificationPossible &&
    !AAccesATousLesUtilisateurs(profilSelectionne);

  const chantiersAccessibleResponsabilite: ChantierSynthétisé[] =
    !afficherChampResponsabiliteChantiers ? [] : chantiersSelectionnesLecture;
  const chantiersAccessibleSaisieCommentaire: ChantierSynthétisé[] =
    !afficherChampSaisieCommentaire
      ? []
      : [
            ProfilEnum.PREFET_DEPARTEMENT,
            ProfilEnum.PREFET_REGION,
            ProfilEnum.COORDINATEUR_DEPARTEMENT,
            ProfilEnum.COORDINATEUR_REGION,
          ].includes(profilCodeSelectionne)
        ? chantiersSelectionnesLecture.filter(
            (chantier) => chantier.ate === "ate",
          )
        : [
              ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
              ProfilEnum.SERVICES_DECONCENTRES_REGION,
            ].includes(profilCodeSelectionne)
          ? chantiersSelectionnesLecture.filter((chantier) =>
              ["ate", "hors_ate_deconcentre"].includes(chantier.ate ?? ""),
            )
          : chantiersSelectionnesLecture;
  watch("profil");

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
    perimetresSelectionnables,
    chantiersAccessibleSaisieCommentaire,
    watch,
  };
}
