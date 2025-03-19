import {
  habilitation as PrismaHabilitationModel,
  Prisma,
  PrismaClient,
  profil as PrismaProfilModel,
  utilisateur as PrismaUtilisateurModel,
} from '@prisma/client';
import {
  ScopeChantiers,
  ScopeUtilisateurs,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface';
import { removeAccents } from '@/server/utils/remove-accents';
import { estUnProfilTerritorialise } from '@/server/app/domain/ProfilTerritorialise';
import { UtilisateurExportCSV } from '@/server/gestion-utilisateur/domain/UtilisateurExportCSV';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import {
  ProfilCode,
  profilsDépartementaux, profilsRégionaux,
  Utilisateur,
} from '@/server/gestion-utilisateur/domain/Utilisateur.interface';

interface Dependencies {
  prisma: PrismaPilote
}

const récupérerChantiersParDéfaut = (profilUtilisateur: PrismaProfilModel, listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[]): Record<ScopeChantiers | ScopeUtilisateurs, InformationChantierUtilisateur['id'][]> => {
  let chantiersAccessibles = profilUtilisateur.a_acces_tous_chantiers
    ? listeInformationsChantiersUtilisateurs
    : profilUtilisateur.a_acces_tous_chantiers_territorialises
      ? listeInformationsChantiersUtilisateurs.reduce((acc, chantier) =>  chantier.estTerritorialise ?  [...acc, chantier] :  acc, [] as InformationChantierUtilisateur[])
      : [];

  const listeChantiersAccessiblesIds = chantiersAccessibles.map(chantier => chantier.id);

  let chantiersAccessiblesEnSaisieCommentaire = estUnProfilTerritorialise(profilUtilisateur.code as ProfilCode)
    ? chantiersAccessibles.reduce((acc, chantier) => {
      if (chantier.estTerritorialise && chantier.ate === 'ate') {
        return [...acc, chantier.id];
      }
      return acc;
    }, [] as string[])
    : listeChantiersAccessiblesIds;

  return {
    lecture: listeChantiersAccessiblesIds,
    saisieCommentaire: chantiersAccessiblesEnSaisieCommentaire,
    saisieIndicateur: [ProfilEnum.DITP_PILOTAGE, ProfilEnum.DITP_ADMIN].includes(profilUtilisateur.code) ? listeChantiersAccessiblesIds : [],
    gestionUtilisateur: profilUtilisateur.peut_modifier_les_utilisateurs ? chantiersAccessiblesEnSaisieCommentaire : [],
    responsabilite: [],
  };
};

const créerLesHabilitations = (profilUtilisateur: PrismaProfilModel, habilitations: PrismaHabilitationModel[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[], territoires: string[], perimetresMinisteriels: string[]) => {
  const chantiersParDéfaut = récupérerChantiersParDéfaut(profilUtilisateur, listeInformationsChantiersUtilisateurs);

  let habilitationsGénérées: Habilitations = {
    lecture: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires: profilUtilisateur.a_acces_tous_les_territoires_lecture,
        aAccesTousLesPerimetres: profilUtilisateur.a_acces_tous_chantiers,
      },
      chantiers: chantiersParDéfaut.lecture,
      territoires: profilUtilisateur.a_acces_tous_les_territoires_lecture ? territoires : [],
      périmètres: profilUtilisateur.a_acces_tous_chantiers ? perimetresMinisteriels : [],
    },
    saisieCommentaire: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires: profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.saisieCommentaire,
      territoires: profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire ? territoires : [],
      périmètres: [],
    },
    saisieIndicateur: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires: profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.saisieIndicateur,
      territoires: profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur ? territoires : [],
      périmètres: [],
    },
    gestionUtilisateur: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs,
        aAccesTousLesTerritoires: profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.gestionUtilisateur,
      territoires: [ProfilEnum.DITP_PILOTAGE, ProfilEnum.DITP_ADMIN].includes(profilUtilisateur.code) ? territoires : [],
      périmètres: [],
    },
    responsabilite: {
      __meta: {
        aAccesTousLesChantiers: false,
        aAccesTousLesTerritoires: false,
        aAccesTousLesPerimetres: false,
      },
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  };

  habilitations.forEach(habilitation => {
    const scopeCode = habilitation.scopeCode as keyof Utilisateur['habilitations'];
    const listeInformationsChantiersUtilisateursApplicableSurTerritoire = estUnProfilTerritorialise(profilUtilisateur.code as ProfilCode)
      ? listeInformationsChantiersUtilisateurs.filter(informationChantier => informationChantier.territoiresApplicables.some(territoire => habilitation.territoires.includes(territoire)))
      : listeInformationsChantiersUtilisateurs;

    const listeChantier =
      scopeCode == 'saisieCommentaire' && [ProfilEnum.SERVICES_DECONCENTRES_REGION, ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT].includes(profilUtilisateur.code) 
        ? listeInformationsChantiersUtilisateursApplicableSurTerritoire.filter(chantier => chantier.ate !== 'hors_ate_centralise') 
        : listeInformationsChantiersUtilisateursApplicableSurTerritoire;

    const chantiersSupplémentaires =
      habilitation.chantiers.length > 0 ?
        listeChantier.filter(chantier => habilitation.chantiers.includes(chantier.id)).map(chantier => chantier.id) :
        habilitation.chantiers;

    const chantiersAssociésAuxPérimètresMinistériels =
      habilitation.perimetres.length > 0 ?
        listeChantier
          .filter(chantier => chantier.perimetreIds.some(p => habilitation.perimetres.includes(p)))
          .map(chantier => chantier.id) :
        [] ;

    const habilitationsChantier = [... new Set([...habilitationsGénérées[scopeCode].chantiers, ...chantiersAssociésAuxPérimètresMinistériels, ...chantiersSupplémentaires])];

    const listeChantiersBrouillonsIds = listeInformationsChantiersUtilisateurs.reduce((acc, chantier) => {
      if (chantier.statut === 'BROUILLON') {
        return [...acc, chantier.id];
      }
      return acc;
    }, [] as string[]);

    habilitationsGénérées[scopeCode].chantiers = profilUtilisateur.a_access_aux_chantiers_brouillons ? habilitationsChantier : habilitationsChantier.filter(habilitationChantier => !listeChantiersBrouillonsIds.includes(habilitationChantier));
    habilitationsGénérées[scopeCode].territoires = [... new Set([...habilitationsGénérées[scopeCode].territoires, ...habilitation.territoires])];
    habilitationsGénérées[scopeCode].périmètres = [... new Set([...habilitationsGénérées[scopeCode].périmètres, ...habilitation.perimetres])];
  });

  return habilitationsGénérées;
};

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async desactiver(email: string, auteurId: string): Promise<void> {
    await this.prisma.utilisateur.updateMany({
      where: { 
        email: email.toLowerCase(),
      }, 
      data: {
        date_desactivation: new Date(),
        date_modification: new Date(),
        auteur_id_modification: auteurId,
      },
    });
  }

  async reactiver(email: string, auteurId: string): Promise<void> {
    await this.prisma.utilisateur.updateMany({
      where: { 
        email: email.toLowerCase(),
      }, 
      data: {
        date_desactivation: null,
        date_modification: new Date(),
        auteur_id_modification: auteurId,
      },
    });
  }
  
  async recupererTous({
    sorting,
    valeurDeLaRecherche,
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    sorting: { id: string, desc: boolean }[],
    valeurDeLaRecherche: string
    listeTerritoiresCodes: string[]
    listePerimetresMinisteriels: string[]
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[]
  }): Promise< UtilisateurListeGestion[]> {
    const valeurDeLaRechercheSansAccentEtEnLowerCase = removeAccents(valeurDeLaRecherche.toLowerCase());

    const unaccentedUtilisateur = await this.prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM utilisateur where LOWER(unaccent(nom)) ILIKE $1
      OR LOWER(unaccent(email)) ILIKE $1
      OR LOWER(unaccent(prenom)) ILIKE $1
      OR LOWER(unaccent(fonction)) ILIKE $1
      OR LOWER(unaccent(profil_code)) ILIKE $1
    `, `%${valeurDeLaRechercheSansAccentEtEnLowerCase}%`);

    const utilisateurs = await this.prisma.utilisateur.findMany({
      include: {
        profil: true,
        habilitation: true,
        auteur_modification: true,
      },
      where: {
        id: {
          in: unaccentedUtilisateur.map(utilisateurIds => utilisateurIds.id),
        },
      },
      orderBy: sorting.reduce((acc, val) => {
        acc[this.convertirEnIdPrisma(val.id) as keyof Prisma.utilisateurOrderByWithRelationInput] = val.desc ? 'desc' : 'asc';
        return acc;
      }, {} as Prisma.utilisateurOrderByWithRelationInput),
    });

    return utilisateurs.map(this.convertirEnUtilisateurListeGestion({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }));
  }

  async recupererPourExports({ valeurDeLaRecherche, listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { valeurDeLaRecherche: string, listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }): Promise<UtilisateurExportCSV[]> {
    const valeurDeLaRechercheSansAccentEtEnLowerCase = removeAccents(valeurDeLaRecherche.toLowerCase());

    const unaccentedUtilisateur = await this.prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM utilisateur where LOWER(unaccent(nom)) ILIKE $1
      OR LOWER(unaccent(email)) ILIKE $1
      OR LOWER(unaccent(prenom)) ILIKE $1
      OR LOWER(unaccent(fonction)) ILIKE $1
      OR LOWER(unaccent(profil_code)) ILIKE $1
    `, `%${valeurDeLaRechercheSansAccentEtEnLowerCase}%`);

    const utilisateurs = await this.prisma.utilisateur.findMany({
      include: {
        profil: true,
        habilitation: true,
        auteur_modification: true,
      },
      where: {
        id: {
          in: unaccentedUtilisateur.map(utilisateurIds => utilisateurIds.id),
        },
      },
      orderBy: [{
        prenom: 'asc',
      }, {
        nom: 'asc',
      } ],
    });

    return utilisateurs.map(this.convertirEnUtilisateurExportCSV({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }));
  }

  async récupérer(email: string, listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[]): Promise<Utilisateur | null> {
    const row = await this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profil: true,
        habilitation: true,
        auteur_creation: true,
        auteur_modification: true,
      },
    });

    if (!row) {
      return null;
    }

    return this.convertirEnUtilisateur({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs })(row);
  }

  async récupérerNombreUtilisateursParTerritoires(territoires: Territoire[]): Promise<Record<string, number>> {
    const territoireCodes = territoires.map(territoireElement => territoireElement.code);

    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        OR: [
          {
            profilCode: {
              in: profilsDépartementaux,
            },
            date_desactivation: null,
            habilitation: {
              some: {
                scopeCode: 'lecture',
                territoires: {
                  hasSome: territoireCodes,
                },
              },
            },
          },
          {
            profilCode: {
              in: profilsRégionaux,
            },
            date_desactivation: null,
            habilitation: {
              some: {
                scopeCode: 'lecture',
                territoires: {
                  hasSome: territoireCodes,
                },
              },
            },
          },
        ],
      },
      select: {
        email: true,
        profilCode: true,
        habilitation: {
          select: {
            territoires: true,
          },
          where: {
            scopeCode: 'lecture',
          },
        },
      },
    });

    return territoires.reduce((acc: { [key: string]: number }, { code, maille }: Territoire) => {
      const profilsCodes = maille === 'departementale' ? profilsDépartementaux : profilsRégionaux;

      acc[code] = utilisateurs.filter(({ habilitation: habilitationUtilisateur, profilCode }) =>
        habilitationUtilisateur.some(habilitation => habilitation.territoires.includes(code)) && profilsCodes.includes(profilCode),
      ).length;

      return acc;
    }, {});
  }

  private _aDesDroitsdeSaisieCommentaire(habilitations: Habilitations, profilUtilisateur: PrismaProfilModel) {
    if (profilUtilisateur.a_acces_tous_chantiers) {
      return profilUtilisateur.peut_saisir_des_commentaires;
    } else {
      const habilitationSaisieCommentaire = habilitations.saisieCommentaire;
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire
        ? habilitationSaisieCommentaire.périmètres.length > 0 || habilitationSaisieCommentaire.chantiers.length > 0
        : habilitationSaisieCommentaire.territoires.length > 0;
    }
  }

  private convertirEnIdPrisma(idSort: string): keyof Prisma.utilisateurOrderByWithRelationInput {
    switch (idSort) {
      case 'email': {
        return 'email';
      }
      case 'nom': {
        return 'nom';
      }
      case 'prénom': {
        return 'prenom';
      }
      case 'profil': {
        return 'profilCode';
      }
      case 'fonction': {
        return 'fonction';
      }
      case 'Dernière modification': {
        return 'date_modification';
      }
      default: {
        return 'date_modification';
      }
    }
  }

  private _aDesDroitsdeSaisieIndicateur(habilitations: Habilitations, profilUtilisateur: PrismaProfilModel) {
    if (profilUtilisateur.a_acces_tous_chantiers && profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur) {
      return true;
    } else {
      const habilitationSaisieIndicateur = habilitations.saisieIndicateur;
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
        ? habilitationSaisieIndicateur.périmètres.length > 0 || habilitationSaisieIndicateur.chantiers.length > 0
        : habilitationSaisieIndicateur.territoires.length > 0;
    }
  }

  private _aDesDroitsdeGestionUtilisateur(habilitations: Habilitations, profilUtilisateur: PrismaProfilModel) {
    const habilitationsFormatés = new Habilitation(habilitations);
    if (!profilUtilisateur.peut_modifier_les_utilisateurs)
      return false;

    if (profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs && profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs)
      return true;

    if (profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs)
      return habilitationsFormatés.possedeAuMoinsUnTerritoireEnGestionUtilisateur();

    if (profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs)
      return habilitationsFormatés.possedeAuMoinsUnChantierEnGestionUtilisateur();

    return false;
  }

  private convertirEnUtilisateurListeGestion({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }) {
    return (utilisateurBrut: PrismaUtilisateurModel & { profil: PrismaProfilModel; habilitation: PrismaHabilitationModel[]; auteur_modification: PrismaUtilisateurModel | null; }): UtilisateurListeGestion => {
      const habilitations = créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation, listeInformationsChantiersUtilisateurs, listeTerritoiresCodes, listePerimetresMinisteriels);

      const auteurModification = utilisateurBrut.auteur_modification;

      return {
        id: utilisateurBrut.id,
        email: utilisateurBrut.email,
        nom: utilisateurBrut.nom || 'Inconnu',
        prénom: utilisateurBrut.prenom || 'Inconnu',
        fonction: utilisateurBrut.fonction,
        habilitations: habilitations,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification ? `${auteurModification.prenom} ${auteurModification.nom}` : 'Auteur Inconnu',
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateDesactivation: utilisateurBrut.date_desactivation?.toISOString() ?? null,
      };
    };
  }

  private convertirEnUtilisateurExportCSV({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }) {
    return (utilisateurBrut: PrismaUtilisateurModel & { profil: PrismaProfilModel; habilitation: PrismaHabilitationModel[]; auteur_modification: PrismaUtilisateurModel | null; }): UtilisateurExportCSV => {
      const habilitations = créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation, listeInformationsChantiersUtilisateurs, listeTerritoiresCodes, listePerimetresMinisteriels);

      const auteurModification = utilisateurBrut.auteur_modification;

      return {
        id: utilisateurBrut.id,
        email: utilisateurBrut.email,
        nom: utilisateurBrut.nom || 'Inconnu',
        prénom: utilisateurBrut.prenom || 'Inconnu',
        fonction: utilisateurBrut.fonction,
        habilitations,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification ? `${auteurModification.prenom} ${auteurModification.nom}` : 'Auteur Inconnu',
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateDesactivation: utilisateurBrut.date_desactivation?.toISOString() ?? null,
        statut: utilisateurBrut.date_desactivation ? 'Désactivé' : 'Activé',
      };
    };
  }

  private convertirEnUtilisateur({ listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }) {
    return (utilisateurBrut: PrismaUtilisateurModel & { profil: PrismaProfilModel; habilitation: PrismaHabilitationModel[]; auteur_creation: PrismaUtilisateurModel | null; auteur_modification: PrismaUtilisateurModel | null }): Utilisateur => {
      const habilitations = créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation, listeInformationsChantiersUtilisateurs, listeTerritoiresCodes, listePerimetresMinisteriels);

      const auteurCreation = utilisateurBrut.auteur_creation;
      const auteurModification = utilisateurBrut.auteur_modification;

      return {
        id: utilisateurBrut.id,
        nom: utilisateurBrut.nom || 'Inconnu',
        prénom: utilisateurBrut.prenom || 'Inconnu',
        email: utilisateurBrut.email,
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification ? `${auteurModification.prenom} ${auteurModification.nom}` : 'Auteur Inconnu',
        dateCreation: utilisateurBrut.date_creation?.toISOString() || null,
        auteurCreation: auteurCreation ? `${auteurCreation.prenom} ${auteurCreation.nom}` : 'Auteur Inconnu',
        fonction: utilisateurBrut.fonction,
        saisieCommentaire: this._aDesDroitsdeSaisieCommentaire(habilitations, utilisateurBrut.profil),
        saisieIndicateur: this._aDesDroitsdeSaisieIndicateur(habilitations, utilisateurBrut.profil),
        gestionUtilisateur: this._aDesDroitsdeGestionUtilisateur(habilitations, utilisateurBrut.profil),
        habilitations: habilitations,
        dateDesactivation: utilisateurBrut.date_desactivation?.toISOString() ?? null,
      };
    };
  }
}
