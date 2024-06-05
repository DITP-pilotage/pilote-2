import { PrismaClient, profil as PrismaProfil } from '@prisma/client';
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
    const prismaProfil = await this.prisma.profil.findUnique({
      where: {
        code: profilCode,
      },
    });

    return prismaProfil ? this._mapperVersLeDomaine(prismaProfil) : null;
  }

  _mapperVersLeDomaine(prismaProfil: PrismaProfil): Profil {
    return {
      code: prismaProfil.code as ProfilCode,
      nom: prismaProfil.nom,
      chantiers: {
        lecture: {
          tous: prismaProfil.a_acces_tous_chantiers,
          tousTerritorialisés: prismaProfil.a_acces_tous_chantiers_territorialises,
          tousTerritoires: prismaProfil.a_acces_tous_les_territoires_lecture,
          brouillons: prismaProfil.a_access_aux_chantiers_brouillons,
        },
        saisieCommentaire: {
          tousTerritoires: prismaProfil.a_acces_tous_les_territoires_saisie_commentaire,
          saisiePossible: prismaProfil.peut_saisir_des_commentaires,
        },
        saisieIndicateur: {
          tousTerritoires: prismaProfil.a_acces_tous_les_territoires_saisie_indicateur,
        },
      },
      projetsStructurants: {
        lecture: {
          tousPérimètres: prismaProfil.projets_structurants_lecture_tous_perimetres,
          mêmePérimètresQueChantiers: prismaProfil.projets_structurants_lecture_meme_perimetres_que_chantiers,
          tousTerritoires: prismaProfil.projets_structurants_lecture_tous_territoires,
          mêmeTerritoiresQueChantiers: prismaProfil.projets_structurants_lecture_meme_territoires_que_chantiers,
        },
      },
      utilisateurs: {
        modificationPossible: prismaProfil.peut_modifier_les_utilisateurs,
        tousTerritoires: prismaProfil.a_acces_a_tous_les_territoires_utilisateurs,
        tousChantiers: prismaProfil.a_acces_a_tous_les_chantiers_utilisateurs,
      },
    };
  }
}
