import { PrismaClient, habilitation, profil, utilisateur, chantier } from '@prisma/client';
import Utilisateur, { Profil, Scope, UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

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

  async créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour): Promise<void> {
    const utilisateurCrééOuMisÀJour = await this._prisma.utilisateur.upsert({
      create: {
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
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

    const scopesÀCréer = Object.entries(u.scopes).map(scope => ({
      utilisateurId: utilisateurCrééOuMisÀJour.id,
      scopeCode: scope[0],
      territoires: scope[1].territoires,
      perimetres: scope[1].périmètres,
      chantiers: scope[1].chantiers,
    }));

    await this._prisma.habilitation.deleteMany({
      where: {
        utilisateurId: utilisateurCrééOuMisÀJour.id,
      },
    });

    await this._prisma.habilitation.createMany({
      data: scopesÀCréer,
    });
  }

  private async _récupérerChantiersParDéfaut(profilUtilisateur: profil): Promise<Chantier['id'][]> {
    let chantiers: chantier[] = [];

    if (profilUtilisateur.a_acces_tous_chantiers === true) {
      chantiers = await this._prisma.chantier.findMany({ distinct: ['id'] });
    } else if (profilUtilisateur.a_acces_tous_chantiers_territorialises === true) {
      chantiers = await this._prisma.chantier.findMany({ where: { est_territorialise: true }, distinct: ['id'] });
    }

    return chantiers.map(c => c.id);
  }

  private async _récupérerTerritoiresParDéfaut(profilUtilisateur: profil): Promise<Record<Scope, string[]>> {
    const territoires = await this._prisma.territoire.findMany();

    let scopesTerritoires: Record<Scope, string[]> = {
      lecture: [],
      'saisie.commentaire': [],
      'saisie.indicateur': [],
    };

    if (profilUtilisateur.a_acces_tous_les_territoires_lecture === true) {
      scopesTerritoires.lecture =  territoires.map(t => t.code);
    } 
    
    if (profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire === true) {
      scopesTerritoires['saisie.commentaire'] =  territoires.map(t => t.code);
    }

    if (profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur === true) {
      scopesTerritoires['saisie.indicateur'] =  territoires.map(t => t.code);
    }

    return scopesTerritoires;
  }

  private async _créerLesScopes(p: profil, habilitations: habilitation[]) {
    const chantiersParDéfautPourUtilisateur = await this._récupérerChantiersParDéfaut(p);
    const territoiresParDéfautPourUtilisateur = await this._récupérerTerritoiresParDéfaut(p);

    let scopes: Utilisateur['scopes'] = {
      lecture: {
        scope: 'lecture',
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur.lecture,
      },
      'saisie.commentaire': {
        scope: 'saisie.commentaire',
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur['saisie.commentaire'],
      },
      'saisie.indicateur': {
        scope: 'saisie.indicateur',
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur['saisie.indicateur'],
      },
    };

    for await (const h of habilitations) {
      const scopeCode = h.scopeCode as keyof Utilisateur['scopes'];

      const chantiersAssociésAuxPérimètresMinistériels = await dependencies.getChantierRepository().récupérerChantierIdsAssociésAuxPérimètresMinistèriels(h.perimetres);
      scopes[scopeCode].chantiers = [...scopes[scopeCode].chantiers, ...chantiersAssociésAuxPérimètresMinistériels, ...h.chantiers];
      scopes[scopeCode].territoires = [...scopes[scopeCode].territoires, ...h.territoires];
    }
    
    return scopes;
  }

  private async _mapperVersDomaine(utilisateurBrut: utilisateur & { profil: profil; habilitation: habilitation[]; }): Promise<Utilisateur> {
    return {
      id: utilisateurBrut.id,
      nom: utilisateurBrut.nom || 'Inconnu',
      prénom: utilisateurBrut.prenom || 'Inconnu',
      email: utilisateurBrut.email,
      profil: utilisateurBrut.profilCode as Profil,
      scopes: await this._créerLesScopes(utilisateurBrut.profil, utilisateurBrut.habilitation),
    };
  }
}
