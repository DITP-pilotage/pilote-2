import { profil as PrismaProfil } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ProfilRepository } from "@/server/gestion-utilisateur/domain/ports/ProfilRepository";
import { Profil, ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

const convertirEnProfil = (prismaProfil: PrismaProfil): Profil => {
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
      tousTerritoires: prismaProfil.a_acces_a_tous_les_territoires_utilisateurs,
      tousChantiers: prismaProfil.a_acces_a_tous_les_chantiers_utilisateurs,
    },
  };
};
export class PrismaProfilRepository implements ProfilRepository {
  async recupererTous(): Promise<Profil[]> {
    const listePrimaProfil = await prisma.profil.findMany();
    return listePrimaProfil.map(convertirEnProfil);
  }
}
