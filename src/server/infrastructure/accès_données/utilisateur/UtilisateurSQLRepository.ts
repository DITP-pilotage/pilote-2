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

    for (let scope of Object.entries(u.scopes)) {
      await this._prisma.habilitation.upsert({
        create: {
          utilisateurId: utilisateurCrééOuMisÀJour.id,
          scopeCode: scope[1].scope as Scope,
          territoires: scope[1].territoires,
          perimetres: scope[1].périmètres,
          chantiers: scope[1].chantiers,
        },
        update: {
          territoires: scope[1].territoires,
          perimetres: scope[1].périmètres,
          chantiers: scope[1].chantiers,
        },
        where: {
          utilisateurId_scopeCode: {
            utilisateurId: utilisateurCrééOuMisÀJour.id,
            scopeCode: scope[1].scope as Scope,
          },
        },
      });
    }
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

  private async _créerLesScopes(p: profil, habilitations: habilitation[]) {
    let scopes: Utilisateur['scopes'] = {
      lecture: {
        scope: 'lecture',
        chantiers: [],
        territoires: [],
      },
      'saisie.commentaire': {
        scope: 'saisie.commentaire',
        chantiers: [],
        territoires: [],
      },
      'saisie.indicateur': {
        scope: 'saisie.indicateur',
        chantiers: [],
        territoires: [],
      },
    };

    const chantiersParDéfautPourUtilisateur = await this._récupérerChantiersParDéfaut(p);

    for await (const h of habilitations) {
      const chantiersAssociésAuxPérimètresMinistériels = await dependencies.getChantierRepository().récupérerChantierIdsAssociésAuxPérimètresMinistèriels(h.perimetres);
      scopes[h.scopeCode as keyof Utilisateur['scopes']].chantiers = [...chantiersParDéfautPourUtilisateur, ...chantiersAssociésAuxPérimètresMinistériels, ...h.chantiers];
      scopes[h.scopeCode as keyof Utilisateur['scopes']].territoires = h.territoires;
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
