import type { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import { indicateursPubliesWhere } from "./indicateurNonAJour";

export type ValeursRecherchees = "vi" | "vc" | "vi_et_vc";

export type LigneIndicateurSansViVc = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  maille: $Enums.Maille;
  territoireCode: string;
  territoireNom: string | null;
  viManquante: boolean;
  vcManquante: boolean;
  derniereVcConnue: { valeur: number; jalon: number } | null;
};

export class GetIndicateursSansViVcQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
    jalon: number;
    valeurs: ValeursRecherchees;
  }): Promise<LigneIndicateurSansViVc[]> {
    const rechercheVi = params.valeurs !== "vc";
    const rechercheVc = params.valeurs !== "vi";

    const criteres: Prisma.indicateur_territoireWhereInput[] = [
      ...(rechercheVi ? [{ valeur_initiale: null }] : []),
      ...(rechercheVc
        ? [
            {
              indicateur_territoire_jalon: {
                some: { jalon: params.jalon, valeur_cible: null },
              },
            },
          ]
        : []),
    ];

    const lignes = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: {
          AND: [
            indicateursPubliesWhere(params),
            { est_applicable: true },
            { OR: criteres },
          ],
        },
        orderBy: [
          { chantier_id: "asc" },
          { id: "asc" },
          { territoire_code: "asc" },
        ],
        select: {
          id: true,
          maille: true,
          territoire_code: true,
          territoire_nom: true,
          valeur_initiale: true,
          indicateur_territoire_jalon: {
            where: { jalon: { lte: params.jalon } },
            orderBy: { jalon: "desc" },
            select: { jalon: true, valeur_cible: true },
          },
          indicateur_identite: {
            select: {
              nom: true,
              chantier_identite: { select: { id: true, nom: true } },
            },
          },
        },
      });

    return lignes.map((ligne) => {
      const vcManquante =
        rechercheVc &&
        ligne.indicateur_territoire_jalon.some(
          ({ jalon, valeur_cible }) =>
            jalon === params.jalon && valeur_cible === null,
        );
      const derniereCible = vcManquante
        ? ligne.indicateur_territoire_jalon.find(
            ({ jalon, valeur_cible }) =>
              jalon < params.jalon && valeur_cible !== null,
          )
        : undefined;

      return {
        chantierId: ligne.indicateur_identite.chantier_identite.id,
        chantierNom: ligne.indicateur_identite.chantier_identite.nom,
        indicateurId: ligne.id,
        indicateurNom: ligne.indicateur_identite.nom,
        maille: ligne.maille,
        territoireCode: ligne.territoire_code,
        territoireNom: ligne.territoire_nom,
        viManquante: rechercheVi && ligne.valeur_initiale === null,
        vcManquante,
        derniereVcConnue:
          derniereCible?.valeur_cible == null
            ? null
            : {
                valeur: derniereCible.valeur_cible,
                jalon: derniereCible.jalon,
              },
      };
    });
  }
}
