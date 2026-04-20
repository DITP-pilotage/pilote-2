import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";
import { prisma } from "@/server/db/prisma";

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  async recupererUtilisateursParProfilEtChantierIds(
    profilCodes: string[],
    listeChantierIds: string[],
  ): Promise<Utilisateur[]> {
    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        statut: "PUBLIE",
      },
      select: {
        id: true,
        perimetre_ids: true,
      },
    });

    const mapPerimetreToChantiers = new Map<string, string[]>();
    chantiers.forEach((chantier) => {
      chantier.perimetre_ids.forEach((perimetreId) => {
        if (!mapPerimetreToChantiers.has(perimetreId)) {
          mapPerimetreToChantiers.set(perimetreId, []);
        }
        mapPerimetreToChantiers.get(perimetreId)!.push(chantier.id);
      });
    });

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        profilCode: { in: profilCodes },
        date_desactivation: null,
        habilitation: {
          some: {
            scopeCode: "lecture",
            OR: [
              {
                chantiers: {
                  hasSome: listeChantierIds,
                },
              },
              {
                perimetres: {
                  isEmpty: false,
                },
              },
            ],
          },
        },
      },
      include: {
        habilitation: true,
      },
    });

    const utilisateursAvecChantiers: Utilisateur[] = [];

    for (const utilisateur of utilisateurs) {
      const habilitationLecture = utilisateur.habilitation.find(
        (habilitation) => habilitation.scopeCode === "lecture",
      );

      if (!habilitationLecture) {
        continue;
      }

      const chantiersDirects = habilitationLecture.chantiers;
      const chantiersViaPerimetres = habilitationLecture.perimetres.flatMap(
        (perimetreId) => mapPerimetreToChantiers.get(perimetreId) ?? [],
      );

      const tousLesChantiers = [
        ...new Set([...chantiersDirects, ...chantiersViaPerimetres]),
      ].filter((chantierId) => listeChantierIds.includes(chantierId));

      if (tousLesChantiers.length === 0) {
        continue;
      }

      utilisateursAvecChantiers.push(
        Utilisateur.creerUtilisateur({
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          listeChantiers: tousLesChantiers,
        }),
      );
    }

    return utilisateursAvecChantiers;
  }
}
