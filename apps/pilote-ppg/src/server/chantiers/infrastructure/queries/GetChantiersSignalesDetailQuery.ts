import { Inject } from "@/server/chantiers/module";
import Alerte from "@/server/domain/alerte/Alerte";
import {
  ChantierTendance,
  ChantierVueDEnsemble,
} from "@/server/domain/chantier/Chantier.interface";
import { CategorieAlerteChantier } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export type ChantierSignale = {
  id: string;
  nom: string;
  meteo: string | null;
  ecart: number | null;
  categories: CategorieAlerteChantier[];
};

export type GetChantiersSignalesDetailResult = ChantierSignale[];

type ChantierTerritoireAvecJalonEtNom = {
  id: string;
  meteo: string | null;
  tendance: string | null;
  nombre_propositions_valeur_actuelle: number;
  maille: string;
  chantier_identite: { nom: string; cible_attendue: boolean };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export class GetChantiersSignalesDetailQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    chantierIds: string[];
    categories: CategorieAlerteChantier[];
  }): Promise<GetChantiersSignalesDetailResult> {
    const prisma = this.deps.prisma.getInstance();

    const chantierTerritoires = await this.recupererChantierTerritoires(
      prisma,
      params,
    );

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);
    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const pvaIds = params.categories.includes("pva")
      ? await this.recupererPvaIds(
          prisma,
          maille,
          chantierIdsApplicables,
          params,
        )
      : new Set<string>();

    const { chantiersAvecDept, chantiersAvecTaux } = params.categories.includes(
      "absence_taux_departemental",
    )
      ? await this.recupererAbsenceTauxDepartementalSets(
          prisma,
          maille,
          chantierTerritoires,
          params.jalon,
        )
      : {
          chantiersAvecDept: new Set<string>(),
          chantiersAvecTaux: new Set<string>(),
        };

    const resultats: ChantierSignale[] = [];

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];
      const ecart = jalonData?.ecart ?? null;
      const tauxAvancement = jalonData?.taux_avancement ?? null;

      const categoriesMatchees = params.categories.filter((categorie) =>
        this.matchCategorie(categorie, {
          ct,
          maille,
          ecart,
          tauxAvancement,
          pvaIds,
          chantiersAvecDept,
          chantiersAvecTaux,
        }),
      );

      if (categoriesMatchees.length === 0) continue;

      resultats.push({
        id: ct.id,
        nom: `${ct.id} — ${ct.chantier_identite.nom}`,
        meteo: ct.meteo,
        ecart,
        categories: categoriesMatchees,
      });
    }

    return resultats;
  }

  private matchCategorie(
    categorie: CategorieAlerteChantier,
    ctx: {
      ct: ChantierTerritoireAvecJalonEtNom;
      maille: string;
      ecart: number | null;
      tauxAvancement: number | null;
      pvaIds: Set<string>;
      chantiersAvecDept: Set<string>;
      chantiersAvecTaux: Set<string>;
    },
  ): boolean {
    const {
      ct,
      maille,
      ecart,
      tauxAvancement,
      pvaIds,
      chantiersAvecDept,
      chantiersAvecTaux,
    } = ctx;

    switch (categorie) {
      case "ecart":
        return Alerte.estEnAlerteÉcart(ecart);
      case "baisse":
        return Alerte.estEnAlerteBaisse(ct.tendance as ChantierTendance | null);
      case "taux_non_calcule":
        return Alerte.estEnAlerteTauxAvancementNonCalculé(
          tauxAvancement,
          ct.chantier_identite.cible_attendue,
        );
      case "absence_taux_departemental": {
        const aUnTauxAvancementDepartemental =
          !chantiersAvecDept.has(ct.id) || chantiersAvecTaux.has(ct.id);
        return Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          aUnTauxAvancementDepartemental,
          ct.chantier_identite.cible_attendue,
        );
      }
      case "meteo_non_renseignee":
        return Alerte.estEnAlerteMétéoNonRenseignée(
          ct.meteo as ChantierVueDEnsemble["météo"],
        );
      case "pva": {
        const aUnePropositionValeurAvancement =
          maille === "DEPT"
            ? ct.nombre_propositions_valeur_actuelle > 0
            : pvaIds.has(ct.id);
        return Alerte.estEnAlertePossedePropositionsValeurAvancement(
          aUnePropositionValeurAvancement,
        );
      }
    }
  }

  private async recupererChantierTerritoires(
    prisma: PilotePrismaClient,
    params: { chantierIds: string[]; territoireCode: string; jalon: number },
  ) {
    return prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
          statut: "PUBLIE",
        },
        id: { in: params.chantierIds },
      },
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        maille: true,
        chantier_identite: {
          select: { nom: true, cible_attendue: true },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
          select: { ecart: true, taux_avancement: true },
        },
      },
    });
  }

  private async recupererPvaIds(
    prisma: PilotePrismaClient,
    maille: string,
    chantierIdsApplicables: string[],
    params: { territoireCode: string },
  ): Promise<Set<string>> {
    if (maille === "NAT") {
      const enfants = await prisma.chantier_territoire.findMany({
        where: {
          id: { in: chantierIdsApplicables },
          maille: { in: ["REG", "DEPT"] },
          est_applicable: true,
          nombre_propositions_valeur_actuelle: { gt: 0 },
        },
        select: { id: true },
      });
      return new Set(enfants.map((e) => e.id));
    }

    if (maille === "REG") {
      const territoiresEnfants = await prisma.territoire.findMany({
        where: { code_parent: params.territoireCode },
        select: { code: true },
      });
      const codesEnfants = territoiresEnfants.map((t) => t.code);
      const enfants = await prisma.chantier_territoire.findMany({
        where: {
          id: { in: chantierIdsApplicables },
          territoire_code: { in: [params.territoireCode, ...codesEnfants] },
          est_applicable: true,
          nombre_propositions_valeur_actuelle: { gt: 0 },
        },
        select: { id: true },
      });
      return new Set(enfants.map((e) => e.id));
    }

    return new Set();
  }

  private async recupererAbsenceTauxDepartementalSets(
    prisma: PilotePrismaClient,
    maille: string,
    chantierTerritoires: ChantierTerritoireAvecJalonEtNom[],
    jalon: number,
  ): Promise<{
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  }> {
    if (maille !== "NAT") {
      return { chantiersAvecDept: new Set(), chantiersAvecTaux: new Set() };
    }

    const chantierIdsCibleAttendue = chantierTerritoires
      .filter((ct) => ct.chantier_identite.cible_attendue)
      .map((ct) => ct.id);

    if (chantierIdsCibleAttendue.length === 0) {
      return { chantiersAvecDept: new Set(), chantiersAvecTaux: new Set() };
    }

    const deptApplicables = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIdsCibleAttendue },
        maille: "DEPT",
        est_applicable: true,
      },
      select: {
        id: true,
        chantier_territoire_jalon: {
          where: { jalon },
          select: { taux_avancement: true },
        },
      },
    });

    const chantiersAvecTaux = new Set(
      deptApplicables
        .filter((dept) =>
          dept.chantier_territoire_jalon.some(
            (j) => j.taux_avancement !== null,
          ),
        )
        .map((dept) => dept.id),
    );

    const chantiersAvecDept = new Set(deptApplicables.map((dept) => dept.id));

    return { chantiersAvecDept, chantiersAvecTaux };
  }
}
