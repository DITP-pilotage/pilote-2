import { PrismaClient, habilitation, profil, utilisateur, chantier } from '@prisma/client';
import Utilisateur, { Profil, UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
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

    let habilitationsTerritoires: Record<Scope, string[]> = {
      lecture: [],
      'saisie.commentaire': [],
      'saisie.indicateur': [],
    };

    if (profilUtilisateur.a_acces_tous_les_territoires_lecture === true) {
      habilitationsTerritoires.lecture =  territoires.map(t => t.code);
    } 
    
    if (profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire === true) {
      habilitationsTerritoires['saisie.commentaire'] =  territoires.map(t => t.code);
    }

    if (profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur === true) {
      habilitationsTerritoires['saisie.indicateur'] =  territoires.map(t => t.code);
    }

    return habilitationsTerritoires;
  }

  private async _créerLesHabilitations(p: profil, habilitations: habilitation[]) {
    const chantiersParDéfautPourUtilisateur = await this._récupérerChantiersParDéfaut(p);
    const territoiresParDéfautPourUtilisateur = await this._récupérerTerritoiresParDéfaut(p);

    let habilitationsGénérées: Utilisateur['habilitations'] = {
      lecture: {
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur.lecture,
      },
      'saisie.commentaire': {
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur['saisie.commentaire'],
      },
      'saisie.indicateur': {
        chantiers: chantiersParDéfautPourUtilisateur,
        territoires: territoiresParDéfautPourUtilisateur['saisie.indicateur'],
      },
    };

    for await (const h of habilitations) {
      const scopeCode = h.scopeCode as keyof Utilisateur['habilitations'];

      const chantiersAssociésAuxPérimètresMinistériels = await dependencies.getChantierRepository().récupérerChantierIdsAssociésAuxPérimètresMinistèriels(h.perimetres);
      habilitationsGénérées[scopeCode].chantiers = [...habilitationsGénérées[scopeCode].chantiers, ...chantiersAssociésAuxPérimètresMinistériels, ...h.chantiers];
      habilitationsGénérées[scopeCode].territoires = [...habilitationsGénérées[scopeCode].territoires, ...h.territoires];
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
      habilitations: await this._créerLesHabilitations(utilisateurBrut.profil, utilisateurBrut.habilitation),
    };
  }
}
