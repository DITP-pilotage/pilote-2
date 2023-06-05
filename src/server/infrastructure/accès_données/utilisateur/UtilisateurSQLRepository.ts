import { PrismaClient, habilitation, profil, utilisateur, chantier, territoire } from '@prisma/client';
import Utilisateur, { Profil, UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Scope } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export class UtilisateurSQLRepository implements UtilisateurRepository {
  constructor(private _prisma: PrismaClient) {}

  async récupérer(email: string): Promise<Utilisateur | null> {
    const row = await this._prisma.utilisateur.findUnique({ 
      where: { email }, 
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

  async récupérerTous(chantierIds: string[], territoireCodes: string[]): Promise<Utilisateur[]> {
    let utilisateursMappés:Utilisateur[] = [];

    const utilisateurs = await this._prisma.utilisateur.findMany(
      {
        include: {
          profil: true,
          habilitation: true,
        },
      },
    );

    for (const u of utilisateurs) {
      const utilisateurMappé = await this._mapperVersDomaine(u);
      utilisateursMappés.push(utilisateurMappé);
    }
    return utilisateursMappés.filter(
      u => (
        chantierIds.some(id => u.habilitations.lecture.chantiers.includes(id))
        || territoireCodes.some(code => u.habilitations.lecture.territoires.includes(code))
      ),
    );
  }

  async créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour): Promise<void> {
    const utilisateurCrééOuMisÀJour = await this._prisma.utilisateur.upsert({
      create: {
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
        auteur_modification: u.auteurModification,
      },
      update: {
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
      },
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

  private async _récupérerChantiersParDéfaut(profilUtilisateur: profil): Promise<Record<Scope, chantier['id'][]>> {
    let chantiersAccessibles: chantier['id'][] = [];

    const tousLesChantiers = await this._prisma.chantier.findMany({ distinct: ['id'] });
    const tousLesChantiersIds = tousLesChantiers.map(c => c.id);
    const tousLesChantiersTerritorialisésIds = tousLesChantiers.filter(c => c.est_territorialise === true).map(c => c.id);

    if (profilUtilisateur.a_acces_tous_chantiers === true) {
      chantiersAccessibles = tousLesChantiersIds;
    } else if (profilUtilisateur.a_acces_tous_chantiers_territorialises === true) {
      chantiersAccessibles = tousLesChantiersTerritorialisésIds;
    }

    const chantiersParDéfaut: Record<Scope, chantier['id'][]>  = {
      'lecture': chantiersAccessibles,
      'saisie.commentaire': chantiersAccessibles,
      'saisie.indicateur': chantiersAccessibles,
      'utilisateurs.lecture': profilUtilisateur.a_access_lecture_utilisateurs_pour_tous_les_chantiers === true ? tousLesChantiersIds : [],
      'utilisateurs.modification': profilUtilisateur.a_access_modification_utilisateurs_pour_tous_les_chantiers === true ? tousLesChantiersIds : [],
      'utilisateurs.suppression': profilUtilisateur.a_access_suppression_utilisateurs_pour_tous_les_chantiers === true ? tousLesChantiersIds : [],
    };

    return chantiersParDéfaut;
  }

  private async _récupérerTerritoiresParDéfaut(profilUtilisateur: profil): Promise<Record<Scope, territoire['code'][]>> {
    const tousLesTerritoires = await this._prisma.territoire.findMany();
    const tousLesTerritoiresCodes = tousLesTerritoires.map(c => c.code);

    const territoiresParDéfaut: Record<Scope, territoire['code'][]>  = {
      'lecture': profilUtilisateur.a_acces_tous_les_territoires_lecture === true ? tousLesTerritoiresCodes : [],
      'saisie.commentaire': profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire === true ? tousLesTerritoiresCodes : [],
      'saisie.indicateur': profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur === true ? tousLesTerritoiresCodes : [],
      'utilisateurs.lecture': profilUtilisateur.a_access_lecture_utilisateurs_pour_tous_les_chantiers === true ? tousLesTerritoiresCodes : [],
      'utilisateurs.modification': profilUtilisateur.a_access_modification_utilisateurs_pour_tous_les_chantiers === true ? tousLesTerritoiresCodes : [],
      'utilisateurs.suppression': profilUtilisateur.a_access_suppression_utilisateurs_pour_tous_les_chantiers === true ? tousLesTerritoiresCodes : [],
    };

    return territoiresParDéfaut;
  }

  private async _créerLesHabilitations(p: profil, habilitations: habilitation[]) {
    const chantiersParDéfaut = await this._récupérerChantiersParDéfaut(p);
    const territoiresParDéfaut = await this._récupérerTerritoiresParDéfaut(p);

    let habilitationsGénérées: Utilisateur['habilitations'] = {
      lecture: {
        chantiers: chantiersParDéfaut.lecture,
        territoires: territoiresParDéfaut.lecture,
      },
      'saisie.commentaire': {
        chantiers: chantiersParDéfaut['saisie.commentaire'],
        territoires: territoiresParDéfaut['saisie.commentaire'],
      },
      'saisie.indicateur': {
        chantiers: chantiersParDéfaut['saisie.indicateur'],
        territoires: territoiresParDéfaut['saisie.indicateur'],
      },
      'utilisateurs.lecture': {
        chantiers: chantiersParDéfaut['utilisateurs.lecture'],
        territoires: territoiresParDéfaut['utilisateurs.lecture'],
      },
      'utilisateurs.modification': {
        chantiers: chantiersParDéfaut['utilisateurs.modification'],
        territoires: territoiresParDéfaut['utilisateurs.modification'],
      },
      'utilisateurs.suppression': {
        chantiers: chantiersParDéfaut['utilisateurs.suppression'],
        territoires: territoiresParDéfaut['utilisateurs.suppression'],
      },
    };

    for await (const h of habilitations) {
      const scopeCode = h.scopeCode as keyof Utilisateur['habilitations'];

      const chantiersAssociésAuxPérimètresMinistériels = await dependencies.getChantierRepository().récupérerChantierIdsAssociésAuxPérimètresMinistèriels(h.perimetres);
      habilitationsGénérées[scopeCode].chantiers = [... new Set([...habilitationsGénérées[scopeCode].chantiers, ...chantiersAssociésAuxPérimètresMinistériels, ...h.chantiers])];
      habilitationsGénérées[scopeCode].territoires = [... new Set([...habilitationsGénérées[scopeCode].territoires, ...h.territoires])];
    }
    
    return habilitationsGénérées;
  }

  private async _mapperVersDomaine(utilisateurBrut: utilisateur & { profil: profil; habilitation: habilitation[]; }): Promise<Utilisateur> {
    return {
      id: utilisateurBrut.id,
      nom: utilisateurBrut.nom || 'Inconnu',
      prénom: utilisateurBrut.prenom || 'Inconnu',
      email: utilisateurBrut.email,
      profil: utilisateurBrut.profilCode as Profil,
      dateModification: utilisateurBrut.date_modification.toISOString(),
      auteurModification: utilisateurBrut.auteur_modification,
      fonction: utilisateurBrut.fonction,
      habilitations: await this._créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation),
    };
  }
}
