import {
  chantier,
  habilitation,
  perimetre,
  PrismaClient,
  profil,
  projet_structurant,
  territoire,
  utilisateur,
} from '@prisma/client';
import Utilisateur, {
  ProfilCode,
  UtilisateurÀCréerOuMettreÀJourSansHabilitation,
} from '@/server/domain/utilisateur/Utilisateur.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
  ScopeChantiers,
  ScopeUtilisateurs,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { objectEntries } from '@/client/utils/objects/objects';

export const convertirEnModel = (utilisateurAConvertir: {
  email: string
  nom: string
  prenom: string
  profilCode: string
  fonction: string | null
  auteurModification: string
  dateModification: Date
  auteurCreation: string
  dateCreation: Date
}): Omit<utilisateur, 'id'> => {
  return {
    email: utilisateurAConvertir.email,
    nom: utilisateurAConvertir.nom,
    prenom: utilisateurAConvertir.prenom,
    profilCode: utilisateurAConvertir.profilCode,
    fonction: utilisateurAConvertir.fonction,
    auteur_modification: utilisateurAConvertir.auteurModification,
    date_modification: utilisateurAConvertir.dateModification,
    auteur_creation: utilisateurAConvertir.auteurCreation,
    date_creation: utilisateurAConvertir.dateCreation,
  };
};


export const convertirEnModelModification = (utilisateurAConvertir: {
  email: string
  nom: string
  prenom: string
  profilCode: string
  fonction: string | null
  auteurModification: string
  dateModification: Date
}): Omit<utilisateur, 'id' | 'auteur_creation' | 'date_creation'> => {
  return {
    email: utilisateurAConvertir.email,
    nom: utilisateurAConvertir.nom,
    prenom: utilisateurAConvertir.prenom,
    profilCode: utilisateurAConvertir.profilCode,
    fonction: utilisateurAConvertir.fonction,
    auteur_modification: utilisateurAConvertir.auteurModification,
    date_modification: utilisateurAConvertir.dateModification,
  };
};

export class UtilisateurSQLRepository implements UtilisateurRepository {
  private _territoires: string[] = [];

  private _chantiers: {
    donnéesBrutes: chantier[]
    groupésParId: Record<chantier['id'], chantier>
    chantiersIdsPérimètresIds: Record<chantier['id'], perimetre['id'][]> 
    ids: chantier['id'][]
  } = {
      donnéesBrutes: [],
      groupésParId: {},
      chantiersIdsPérimètresIds: {},
      ids: [],
    };

  private _projetsStructurants: {
    donnéesBrutes: projet_structurant[]
    groupésParId: Record<projet_structurant['id'], projet_structurant>
    périmètresIdsProjetsStructurantsIds: Record<perimetre['id'], projet_structurant['id'][]>
    ids: projet_structurant['id'][]
  } = {
      donnéesBrutes: [],
      groupésParId: {},
      périmètresIdsProjetsStructurantsIds: {},
      ids: [],
    };

  private _chantiersTerritorialisésIds: string[] = [];

  private _chantiersBrouillonsIds: string [] = [];

  private _périmètresMinistériels: string[] = [];

  constructor(private _prisma: PrismaClient) {}

  async _récupérerTerritoires() {
    if (this._territoires.length === 0) {
      const tousLesTerritoires = await this._prisma.territoire.findMany();
      this._territoires = tousLesTerritoires.map(c => c.code);
    }
  }

  async _récupérerProjetsStructurants() {
    if (this._projetsStructurants.donnéesBrutes.length === 0) {
      const tousLesProjetsStructurants = await this._prisma.projet_structurant.findMany();

      this._projetsStructurants.donnéesBrutes = tousLesProjetsStructurants;

      tousLesProjetsStructurants.forEach(ps => {
        this._projetsStructurants.groupésParId[ps.id] = ps;
        this._projetsStructurants.ids.push(ps.id);

        ps.perimetres_ids.forEach(périmètreId => {
          if (périmètreId in this._projetsStructurants.périmètresIdsProjetsStructurantsIds) {
            this._projetsStructurants.périmètresIdsProjetsStructurantsIds[périmètreId].push(ps.id);
          } else {
            this._projetsStructurants.périmètresIdsProjetsStructurantsIds[périmètreId] = [ps.id];
          }
        });
      });
    }
  }

  async _récupérerChantiers() {
    if (this._chantiers.donnéesBrutes.length === 0) {
      const tousLesChantiers = await this._prisma.chantier.findMany({ distinct: ['id'] });

      this._chantiers.donnéesBrutes = tousLesChantiers;

      tousLesChantiers.forEach(c => {
        this._chantiers.groupésParId[c.id] = c;
        this._chantiers.ids.push(c.id);
        this._chantiers.chantiersIdsPérimètresIds[c.id] = c.perimetre_ids;

        if (c.est_territorialise === true) {
          this._chantiersTerritorialisésIds.push(c.id);
        }

        if (c.statut === 'BROUILLON') {
          this._chantiersBrouillonsIds.push(c.id);
        }
      });
    }
  }

  async _récupérerPérimètresMinistériels() {
    if (this._périmètresMinistériels.length === 0) {
      const tousLesPérimètresMinistériels = await this._prisma.perimetre.findMany();
      this._périmètresMinistériels = tousLesPérimètresMinistériels.map(périmètre => périmètre.id);
    }
  }

  async supprimer(email: string): Promise<void> {
    await this._prisma.utilisateur.delete({ 
      where: { email: email.toLowerCase() }, 
      include: { 
        habilitation: true, 
      },
    });
  }

  async récupérer(email: string): Promise<Utilisateur | null> {
    await this._récupérerTerritoires();
    await this._récupérerChantiers();
    await this._récupérerProjetsStructurants();
    await this._récupérerPérimètresMinistériels();

    const row = await this._prisma.utilisateur.findUnique({ 
      where: { email: email.toLowerCase() }, 
      include: { 
        profil: true, 
        habilitation: true, 
      },
    });

    if (!row) {
      return null;
    }

    return this._mapperVersDomaine(row);
  }

  async getById(id: string): Promise<Utilisateur | null> {
    await this._récupérerTerritoires();
    await this._récupérerChantiers();
    await this._récupérerProjetsStructurants();
    await this._récupérerPérimètresMinistériels();

    const row = await this._prisma.utilisateur.findUnique({
      where: { id },
      include: {
        profil: true,
        habilitation: true,
      },
    });

    if (!row) {
      return null;
    }

    return this._mapperVersDomaine(row);
  }

  async récupérerTous(chantierIds: string[], territoireCodes: string[], filtrer: boolean = true): Promise<Utilisateur[]> {
    let utilisateursMappés:Utilisateur[] = [];
    await this._récupérerTerritoires();
    await this._récupérerChantiers();
    await this._récupérerProjetsStructurants();
    await this._récupérerPérimètresMinistériels();

    const utilisateurs = await this._prisma.utilisateur.findMany(
      {
        include: {
          profil: true,
          habilitation: true,
        },
        orderBy: {
          date_modification: 'desc',
        },
      },
      
    );

    for (const u of utilisateurs) {
      const utilisateurMappé = await this._mapperVersDomaine(u);
      utilisateursMappés.push(utilisateurMappé);
    }

    if (filtrer) {
      return utilisateursMappés.filter(
        u => (
          u.habilitations.lecture.chantiers.every(id => chantierIds.includes(id))
          && u.habilitations.lecture.territoires.every(code => territoireCodes.includes(code))
        ),
      );
    }

    return utilisateursMappés;
  }

  async récupérerExistants(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]> {

    const utilisateursExistants = await this._prisma.utilisateur.findMany({
      where: {
        email: {
          in: utilisateurs.map(u => u.email),
        },
      },
    });

    return utilisateursExistants.map(u => u.email);
  }

  async créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteur: string): Promise<void> {
   
    const utilisateurCrééOuMisÀJour = await this._prisma.utilisateur.upsert({
      create: convertirEnModel({
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
        fonction: u.fonction,
        auteurCreation: auteur,
        dateCreation: new Date(),
        auteurModification: auteur,
        dateModification: new Date(),
      }),
      update: convertirEnModelModification({
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
        fonction: u.fonction,
        auteurModification: auteur,
        dateModification: new Date(),
      }),
      where: {
        email: u.email.toLowerCase(),
      },
    });

    const habilitationsÀCréer = Object.entries(u.habilitations).map(h => ({
      utilisateurId: utilisateurCrééOuMisÀJour.id,
      scopeCode: h[0],
      territoires: h[1].territoires,
      perimetres: h[1].périmètres,
      chantiers: h[1].chantiers,
    }));

    await this._prisma.habilitation.deleteMany({
      where: {
        utilisateurId: utilisateurCrééOuMisÀJour.id,
      },
    });

    await this._prisma.habilitation.createMany({
      data: habilitationsÀCréer,
    });
  }

  private async _récupérerChantiersParDéfaut(profilUtilisateur: profil): Promise<Record<ScopeChantiers | ScopeUtilisateurs, chantier['id'][]>> {
    let chantiersAccessibles: chantier['id'][] = [];
    let chantiersAccessiblesEnSaisieCommentaire: chantier['id'][] = [];

    if (profilUtilisateur.a_acces_tous_chantiers) {
      chantiersAccessibles = this._chantiers.ids;
    } else if (profilUtilisateur.a_acces_tous_chantiers_territorialises) {
      chantiersAccessibles = this._chantiersTerritorialisésIds;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (['REFERENT_REGION', 'PREFET_REGION', 'REFERENT_DEPARTEMENT', 'PREFET_DEPARTEMENT'].includes(profilUtilisateur.code)) {
      chantiersAccessiblesEnSaisieCommentaire = objectEntries(this._chantiers.groupésParId)
        .filter(([_, c]) => c.est_territorialise && c.ate === 'ate')
        .map(([_, c]) => c.id);
    } else {
      chantiersAccessiblesEnSaisieCommentaire = chantiersAccessibles;
    }

    if (profilUtilisateur.a_acces_tous_chantiers) {
      chantiersAccessibles = this._chantiers.ids;
    } 

    return {
      'lecture': chantiersAccessibles,
      'saisieCommentaire': chantiersAccessiblesEnSaisieCommentaire,
      'saisieIndicateur': ['DITP_PILOTAGE', 'DITP_ADMIN'].includes(profilUtilisateur.code) ? chantiersAccessibles : [],
      'utilisateurs.lecture': profilUtilisateur.peut_consulter_les_utilisateurs ? chantiersAccessibles : [],
      'utilisateurs.modification': profilUtilisateur.peut_modifier_les_utilisateurs ? chantiersAccessibles : [],
      'utilisateurs.suppression': profilUtilisateur.peut_supprimer_les_utilisateurs ? chantiersAccessibles : [],
    };
  }

  private async _récupérerTerritoiresParDéfaut(profilUtilisateur: profil): Promise<Record<ScopeChantiers | ScopeUtilisateurs, territoire['code'][]>> {
    return {
      'lecture': profilUtilisateur.a_acces_tous_les_territoires_lecture ? this._territoires : [],
      'saisieCommentaire': profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire ? this._territoires : [],
      'saisieIndicateur': profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur ? this._territoires : [],
      'utilisateurs.lecture': profilUtilisateur.peut_consulter_les_utilisateurs ? this._territoires : [],
      'utilisateurs.modification': profilUtilisateur.peut_modifier_les_utilisateurs ? this._territoires : [],
      'utilisateurs.suppression': profilUtilisateur.peut_supprimer_les_utilisateurs ? this._territoires : [],
    };
  }

  private async _récupérerPérimètresMinistérielsParDéfaut(profilUtilisateur: profil): Promise<Record<ScopeChantiers | ScopeUtilisateurs, perimetre['id'][]>> {
    return {
      // on dit que ceux qui ont accès à tous les chantiers ont accès à tous les périmètres ministériels
      'lecture': profilUtilisateur.a_acces_tous_chantiers ? this._périmètresMinistériels : [],
      'saisieCommentaire': [],
      'saisieIndicateur': [],
      'utilisateurs.lecture': profilUtilisateur.peut_consulter_les_utilisateurs ? this._périmètresMinistériels : [],
      'utilisateurs.modification': profilUtilisateur.peut_modifier_les_utilisateurs ? this._périmètresMinistériels : [],
      'utilisateurs.suppression': profilUtilisateur.peut_supprimer_les_utilisateurs ? this._périmètresMinistériels : [],
    };
  }

  private async _récupérerProjetsStructurantsUtilisateur(profilUtilisateur: profil, chantiersIdsAccessiblesEnLecture: string[], territoiresCodesAccessiblesEnLecture: string[]): Promise<string[]> {
    const accèsTousPérimètres = profilUtilisateur.projets_structurants_lecture_tous_perimetres;
    const accèsTousTerritoires = profilUtilisateur.projets_structurants_lecture_tous_territoires;
    const accèsMêmePérimètresQueChantiers = profilUtilisateur.projets_structurants_lecture_meme_perimetres_que_chantiers;
    const accèsMêmeTerritoiresQueChantiers = profilUtilisateur.projets_structurants_lecture_meme_territoires_que_chantiers;
    
    if (accèsTousPérimètres && accèsTousTerritoires) {
      return this._projetsStructurants.ids;
    }

    if (accèsTousPérimètres && accèsMêmeTerritoiresQueChantiers) {
      return this._projetsStructurants.donnéesBrutes
        .filter(ps => territoiresCodesAccessiblesEnLecture.includes(ps.territoire_code))
        .map(ps => ps.id);
    }

    if (accèsMêmePérimètresQueChantiers) {
      const périmètresIdsAccessiblesEnLecture = [...new Set(chantiersIdsAccessiblesEnLecture.flatMap(chantierId => this._chantiers.chantiersIdsPérimètresIds[chantierId]))];
      const projetsStructurantsIdsIssusDesPérimètresAccessibles = [...new Set(périmètresIdsAccessiblesEnLecture.flatMap(perimètreId => this._projetsStructurants.périmètresIdsProjetsStructurantsIds[perimètreId] ?? []))];

      if (accèsTousTerritoires) {
        return projetsStructurantsIdsIssusDesPérimètresAccessibles;
      }

      if (accèsMêmeTerritoiresQueChantiers) {
        return projetsStructurantsIdsIssusDesPérimètresAccessibles.filter(id => id && territoiresCodesAccessiblesEnLecture.includes(this._projetsStructurants.groupésParId[id].territoire_code));
      }
    }

    return [];
  }

  private _aDesDroitsdeSaisieCommentaire(habilitations: Habilitations, profilUtilisateur: profil) {
    if (profilUtilisateur.a_acces_tous_chantiers) {
      return profilUtilisateur.peut_saisir_des_commentaires;
    } else {
      const habilitationSaisieCommentaire = habilitations['saisieCommentaire'];
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire
        ? habilitationSaisieCommentaire.périmètres.length > 0 || habilitationSaisieCommentaire.chantiers.length > 0
        : habilitationSaisieCommentaire.territoires.length > 0;
    }
  }

  private _aDesDroitsdeSaisieIndicateur(habilitations: Habilitations, profilUtilisateur: profil) {
    if (profilUtilisateur.a_acces_tous_chantiers && profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur) {
      return true;
    } else {
      const habilitationSaisieIndicateur = habilitations['saisieIndicateur'];
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
        ? habilitationSaisieIndicateur.périmètres.length > 0 || habilitationSaisieIndicateur.chantiers.length > 0
        : habilitationSaisieIndicateur.territoires.length > 0;
    }
  }

  private async _créerLesHabilitations(profilUtilisateur: profil, habilitations: habilitation[]) {
    const chantiersParDéfaut = await this._récupérerChantiersParDéfaut(profilUtilisateur);
    const territoiresParDéfaut = await this._récupérerTerritoiresParDéfaut(profilUtilisateur);
    const périmètresMinistérielsParDéfaut = await this._récupérerPérimètresMinistérielsParDéfaut(profilUtilisateur);
    let habilitationsGénérées: Utilisateur['habilitations'] = {
      lecture: {
        chantiers: chantiersParDéfaut.lecture,
        territoires: territoiresParDéfaut.lecture,
        périmètres: périmètresMinistérielsParDéfaut.lecture,
      },
      'saisieCommentaire': {
        chantiers: chantiersParDéfaut['saisieCommentaire'],
        territoires: territoiresParDéfaut['saisieCommentaire'],
        périmètres: périmètresMinistérielsParDéfaut['saisieCommentaire'],
      },
      'saisieIndicateur': {
        chantiers: chantiersParDéfaut['saisieIndicateur'],
        territoires: territoiresParDéfaut['saisieIndicateur'],
        périmètres: périmètresMinistérielsParDéfaut['saisieIndicateur'],
      },
      'utilisateurs.lecture': {
        chantiers: chantiersParDéfaut['utilisateurs.lecture'],
        territoires: territoiresParDéfaut['utilisateurs.lecture'],
        périmètres: périmètresMinistérielsParDéfaut['utilisateurs.lecture'],
      },
      'utilisateurs.modification': {
        chantiers: chantiersParDéfaut['utilisateurs.modification'],
        territoires: territoiresParDéfaut['utilisateurs.modification'],
        périmètres: périmètresMinistérielsParDéfaut['utilisateurs.modification'],
      },
      'utilisateurs.suppression': {
        chantiers: chantiersParDéfaut['utilisateurs.suppression'],
        territoires: territoiresParDéfaut['utilisateurs.suppression'],
        périmètres: périmètresMinistérielsParDéfaut['utilisateurs.suppression'],
      },
      'projetsStructurants.lecture': {
        projetsStructurants: [],
      },
    };

    for await (const h of habilitations) {
      const scopeCode = h.scopeCode as keyof Utilisateur['habilitations'];
      if (scopeCode !== 'projetsStructurants.lecture') {
        const listeChantier = 
          scopeCode == 'saisieCommentaire' && ['SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT'].includes(profilUtilisateur.code) ?
            this._chantiers.donnéesBrutes.filter(c => c.ate !== 'hors_ate_centralise') :
            this._chantiers.donnéesBrutes;

        const chantiersSupplémentaires = 
          h.chantiers.length > 0 ? 
            listeChantier.filter(c => h.chantiers.includes(c.id)).map(c => c.id) :
            h.chantiers;

        const chantiersAssociésAuxPérimètresMinistériels = 
          h.perimetres.length > 0 ? 
            listeChantier
              .filter(c => c.perimetre_ids.some(p => h.perimetres.includes(p)))
              .map(c => c.id) :
            [] ;
        
        const habilitationsChantier = [... new Set([...habilitationsGénérées[scopeCode].chantiers, ...chantiersAssociésAuxPérimètresMinistériels, ...chantiersSupplémentaires])];

        habilitationsGénérées[scopeCode].chantiers = profilUtilisateur.a_access_aux_chantiers_brouillons ? habilitationsChantier : habilitationsChantier.filter(c => !this._chantiersBrouillonsIds.includes(c));
        habilitationsGénérées[scopeCode].territoires = [... new Set([...habilitationsGénérées[scopeCode].territoires, ...h.territoires])];
        habilitationsGénérées[scopeCode].périmètres = [... new Set([...habilitationsGénérées[scopeCode].périmètres, ...h.perimetres])];
      }
    }

    habilitationsGénérées['projetsStructurants.lecture'].projetsStructurants = await this._récupérerProjetsStructurantsUtilisateur(profilUtilisateur, habilitationsGénérées.lecture.chantiers, habilitationsGénérées.lecture.territoires);
    return habilitationsGénérées;
  }

  private async _mapperVersDomaine(utilisateurBrut: utilisateur & { profil: profil; habilitation: habilitation[]; }): Promise<Utilisateur> {
    const habilitations = await this._créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation);
    
    return {
      id: utilisateurBrut.id,
      nom: utilisateurBrut.nom || 'Inconnu',
      prénom: utilisateurBrut.prenom || 'Inconnu',
      email: utilisateurBrut.email,
      profil: utilisateurBrut.profilCode as ProfilCode,
      dateModification: utilisateurBrut.date_modification?.toISOString(),
      auteurModification: utilisateurBrut.auteur_modification,
      dateCreation: utilisateurBrut.date_creation?.toISOString() || null,
      auteurCreation: utilisateurBrut.auteur_creation,
      fonction: utilisateurBrut.fonction,
      saisieCommentaire: this._aDesDroitsdeSaisieCommentaire(habilitations, utilisateurBrut.profil),
      saisieIndicateur: this._aDesDroitsdeSaisieIndicateur(habilitations, utilisateurBrut.profil),
      habilitations: habilitations,
    };
  }
}
