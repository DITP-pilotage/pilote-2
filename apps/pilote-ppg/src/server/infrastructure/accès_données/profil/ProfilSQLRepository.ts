import { profil as PrismaProfil } from "@prisma/client";
import ProfilRepository from "@/server/domain/profil/ProfilRepository";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { prisma } from "@/server/db/prisma";

export default class ProfilSQLRepository implements ProfilRepository {
  async récupérerTous(): Promise<Profil[]> {
    const tousLesProfils = await prisma.profil.findMany();
    return tousLesProfils.map((profil) => this._mapperVersLeDomaine(profil));
  }

  async récupérer(profilCode: ProfilCode): Promise<Profil | null> {
    const prismaProfil = await prisma.profil.findUnique({
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
          tousTerritorialisés:
            prismaProfil.a_acces_tous_chantiers_territorialises,
          tousTerritoires: prismaProfil.a_acces_tous_les_territoires_lecture,
          brouillons: prismaProfil.a_access_aux_chantiers_brouillons,
        },
        saisieCommentaire: {
          tousTerritoires:
            prismaProfil.a_acces_tous_les_territoires_saisie_commentaire,
          saisiePossible: prismaProfil.peut_saisir_des_commentaires,
        },
        saisieIndicateur: {
          tousTerritoires:
            prismaProfil.a_acces_tous_les_territoires_saisie_indicateur,
        },
      },
      utilisateurs: {
        modificationPossible: prismaProfil.peut_modifier_les_utilisateurs,
        tousTerritoires:
          prismaProfil.a_acces_a_tous_les_territoires_utilisateurs,
        tousChantiers: prismaProfil.a_acces_a_tous_les_chantiers_utilisateurs,
      },
    };
  }
}
