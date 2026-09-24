import { $Enums, type Prisma } from "@prisma/client";
import type { Inject } from "@/server/suivi-indicateurs/module";
import { assemblerIndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/assemblerIndicateursAMettreAJour";
import type { IndicateursAMettreAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

export const filtreIndicateurTerritoirePublie = (
  chantierIds: string[],
): Prisma.indicateur_territoireWhereInput => ({
  chantier_id: { in: chantierIds },
  est_applicable: true,
  indicateur_identite: {
    statut: $Enums.type_statut_indicateur.PUBLIE,
    chantier_identite: { statut: $Enums.type_statut.PUBLIE },
  },
});

export const filtreNonAJour: Prisma.indicateur_territoireWhereInput = {
  OR: [{ est_a_jour: false }, { est_a_jour: null }],
};

export class ListerIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    chantierIds: string[],
    jalon: number,
  ): Promise<IndicateursAMettreAJour> {
    const prisma = this.deps.prisma.getInstance();
    const filtrePublie = filtreIndicateurTerritoirePublie(chantierIds);

    const [applicables, enRetard, aParametrer] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id"],
        where: filtrePublie,
        _count: { _all: true },
      }),
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: { AND: [filtrePublie, filtreNonAJour] },
        _count: { _all: true },
        _min: {
          prochaine_date_maj_jours: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
        },
      }),
      prisma.indicateur_territoire.findMany({
        where: {
          AND: [
            filtrePublie,
            {
              OR: [
                { valeur_initiale: null },
                {
                  indicateur_territoire_jalon: {
                    some: { jalon, valeur_cible: null },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          valeur_initiale: true,
          indicateur_territoire_jalon: {
            where: { jalon, valeur_cible: null },
            select: { jalon: true },
          },
        },
      }),
    ]);

    const indicateurIds = [
      ...new Set([
        ...enRetard.map((groupe) => groupe.id),
        ...aParametrer.map((ligne) => ligne.id),
      ]),
    ];
    const identites = await prisma.indicateur_identite.findMany({
      where: { id: { in: indicateurIds } },
      select: {
        id: true,
        nom: true,
        chantier_id: true,
        periodicite: true,
        delai_disponibilite: true,
        responsables_donnees_mails: true,
        chantier_identite: { select: { nom: true } },
      },
    });

    return assemblerIndicateursAMettreAJour({
      identites: identites.map((identite) => ({
        indicateurId: identite.id,
        nom: identite.nom,
        chantierId: identite.chantier_id,
        chantierNom: identite.chantier_identite.nom,
        periodicite: identite.periodicite,
        delaiDisponibilite: identite.delai_disponibilite,
        responsablesDonneesMails: identite.responsables_donnees_mails,
      })),
      applicables: applicables.map((groupe) => ({
        indicateurId: groupe.id,
        nbTerritoires: groupe._count._all,
      })),
      enRetard: enRetard.map((groupe) => ({
        indicateurId: groupe.id,
        maille: groupe.maille,
        nbTerritoires: groupe._count._all,
        minProchaineDateMajJours: groupe._min.prochaine_date_maj_jours,
        minDateDerniereValeur: groupe._min.date_valeur_actuelle_mandat,
        minDateMajAttendue: groupe._min.prochaine_date_maj,
      })),
      aParametrer: aParametrer.map((ligne) => ({
        indicateurId: ligne.id,
        valeurInitialeManquante: ligne.valeur_initiale === null,
        valeurCibleManquante: ligne.indicateur_territoire_jalon.length > 0,
      })),
    });
  }
}
