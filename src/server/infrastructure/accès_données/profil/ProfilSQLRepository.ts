import { PrismaClient, profil } from '@prisma/client';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default class ProfilSQLRepository implements ProfilRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupérerTous(): Promise<Profil[]> {
    const tousLesProfils = await this.prisma.profil.findMany();
    return tousLesProfils.map(p => this._mapperVersLeDomaine(p));
  }

  async récupérer(profilCode: ProfilCode): Promise<Profil | null> {
    const p = await this.prisma.profil.findUnique({
      where: {
        code: profilCode,
      },
    });

    return p ? this._mapperVersLeDomaine(p) : null;
  }

  _mapperVersLeDomaine(p: profil): Profil {
    return {
      code: p.code as ProfilCode,
      nom: p.nom,
      chantiers: {
        lecture: {
          tous: p.a_acces_tous_chantiers,
          tousTerritorialisés: p.a_acces_tous_chantiers_territorialises,
          tousTerritoires: p.a_acces_tous_les_territoires_lecture,
        },
        saisieCommentaire: {
          tousTerritoires: p.a_acces_tous_les_territoires_saisie_commentaire,
        },
        saisieIndicateur: {
          tousTerritoires: p.a_acces_tous_les_territoires_saisie_indicateur,
        },
      },
      projetsStructurants: {
        lecture: {
          tousPérimètres: p.projets_structurants_lecture_tous_perimetres,
          mêmePérimètresQueChantiers: p.projets_structurants_lecture_meme_perimetres_que_chantiers,
          tousTerritoires: p.projets_structurants_lecture_tous_territoires,
          mêmeTerritoiresQueChantiers: p.projets_structurants_lecture_meme_territoires_que_chantiers,
        },
      },
      utilisateurs: {
        lecture: p.peut_consulter_les_utilisateurs,
        modification: p.peut_modifier_les_utilisateurs,
        suppression:  p.peut_supprimer_les_utilisateurs,
      },
    };
  }
}
