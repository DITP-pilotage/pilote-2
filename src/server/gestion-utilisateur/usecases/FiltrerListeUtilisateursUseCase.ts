import { PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE } from "@/server/domain/utilisateur/profils-gestion-utilisateur";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { UtilisateurListeGestion } from "@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface";
import { FiltreQueryParams } from "@/server/gestion-utilisateur/app/contrats/FiltreQueryParams";
import { UtilisateurExportCSV } from "@/server/gestion-utilisateur/domain/UtilisateurExportCSV";

export class FiltrerListeUtilisateursUseCase {
  private utilisateurPasseLeFiltreTerritoire(
    utilisateur: UtilisateurListeGestion,
    listeTerritoires: string[],
  ) {
    if (listeTerritoires.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.territoires.some((territoire) =>
      listeTerritoires.includes(territoire),
    );
  }

  private utilisateurPasseLeFiltrePérimètreMinistériel(
    utilisateur: UtilisateurListeGestion,
    listePerimetresMinisteriels: string[],
    listeChantiersAssociesAuxPerimetres: string[],
  ) {
    if (listePerimetresMinisteriels.length === 0) {
      return true;
    }

    return (
      utilisateur.habilitations.lecture.périmètres.some((périmètre) =>
        listePerimetresMinisteriels.includes(périmètre),
      ) ||
      utilisateur.habilitations.lecture.chantiers.some((chantier) =>
        listeChantiersAssociesAuxPerimetres.includes(chantier),
      )
    );
  }

  private utilisateurPasseLeFiltreChantier(
    utilisateur: UtilisateurListeGestion,
    listeChantiers: string[],
  ) {
    if (listeChantiers.length === 0) {
      return true;
    }

    return utilisateur.habilitations.lecture.chantiers.some((chantier) =>
      listeChantiers.includes(chantier),
    );
  }

  private utilisateurPasseLeFiltreProfil(
    utilisateur: UtilisateurListeGestion,
    listeProfils: string[],
  ) {
    if (listeProfils.length === 0) {
      return true;
    }

    return listeProfils.includes(utilisateur.profil);
  }

  private utilisateurEstActif(utilisateur: UtilisateurListeGestion) {
    return utilisateur.dateDesactivation === null;
  }

  private utilisateurPasseLeFiltreTypeCompte(
    utilisateur: UtilisateurListeGestion,
    listeTypesComptes: string[],
  ) {
    if (
      listeTypesComptes.includes("actif") &&
      listeTypesComptes.includes("desactive")
    ) {
      return true;
    } else if (listeTypesComptes.includes("actif")) {
      return this.utilisateurEstActif(utilisateur);
    } else {
      return !this.utilisateurEstActif(utilisateur);
    }
  }

  private utilisateurPasseLesFiltres(
    utilisateur: UtilisateurListeGestion,
    filtresActifs: FiltreQueryParams,
  ) {
    return (
      this.utilisateurPasseLeFiltreTerritoire(
        utilisateur,
        filtresActifs.territoires,
      ) &&
      this.utilisateurPasseLeFiltreChantier(
        utilisateur,
        filtresActifs.chantiers,
      ) &&
      this.utilisateurPasseLeFiltrePérimètreMinistériel(
        utilisateur,
        filtresActifs.perimetresMinisteriels,
        filtresActifs.chantiersAssociésAuxPérimètres,
      ) &&
      this.utilisateurPasseLeFiltreProfil(utilisateur, filtresActifs.profils) &&
      this.utilisateurPasseLeFiltreTypeCompte(
        utilisateur,
        filtresActifs.typeCompte,
      )
    );
  }

  private profilEstAutorisé(
    utilisateur: UtilisateurListeGestion,
    profil: ProfilCode,
  ) {
    return PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE[
      profil as keyof typeof PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE
    ].includes(utilisateur.profil);
  }

  private territoireEstAutorisé(
    utilisateur: UtilisateurListeGestion,
    habilitation: Habilitation,
  ) {
    return utilisateur.habilitations.lecture.territoires.some((territoire) =>
      habilitation.peutAccéderAuTerritoireUtilisateurs(territoire),
    );
  }

  private chantierEstAutorisé(
    utilisateur: UtilisateurListeGestion,
    habilitation: Habilitation,
  ) {
    return utilisateur.habilitations.lecture.chantiers.some((chantier) =>
      habilitation.peutAccéderAuChantierUtilisateurs(chantier),
    );
  }

  private utilisateurEstAutorisé(
    utilisateur: UtilisateurListeGestion,
    profil: ProfilCode,
    habilitation: Habilitation,
  ) {
    if (
      !Object.keys(PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE).includes(
        profil,
      )
    )
      return true;

    return (
      this.profilEstAutorisé(utilisateur, profil) &&
      this.territoireEstAutorisé(utilisateur, habilitation) &&
      this.chantierEstAutorisé(utilisateur, habilitation)
    );
  }

  run<T extends UtilisateurListeGestion | UtilisateurExportCSV>({
    utilisateurs,
    filtresActifs,
    profil,
    habilitation,
  }: {
    utilisateurs: T[];
    filtresActifs: FiltreQueryParams;
    profil: ProfilCode;
    habilitation: Habilitation;
  }): T[] {
    return utilisateurs.filter(
      (utilisateur) =>
        this.utilisateurPasseLesFiltres(utilisateur, filtresActifs) &&
        this.utilisateurEstAutorisé(utilisateur, profil, habilitation),
    );
  }
}
