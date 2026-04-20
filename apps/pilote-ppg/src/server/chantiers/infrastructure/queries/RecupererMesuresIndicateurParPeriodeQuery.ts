import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  convertirTerritoireCodeEnZoneId,
  convertirZoneIdEnTerritoireCode,
} from "@/server/app/domain/Territoire";

export type MesureIndicateurDTO = {
  id: string;
  indicateurId: string;
  indicateurNom: string;
  territoireCode: string;
  territoireNom: string;
  typeValeur: "VALEUR_INITIALE" | "VALEUR_CIBLE";
  dateValeur: Date;
  valeur: number | null;
  dateImport: Date;
};

export class RecupererMesuresIndicateurParPeriodeQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
    dateFin: Date;
    typesValeur: ("VALEUR_INITIALE" | "VALEUR_CIBLE")[];
  }): Promise<MesureIndicateurDTO[]> {
    if (
      params.indicateurIds.length === 0 ||
      params.territoireCodes.length === 0 ||
      params.typesValeur.length === 0
    ) {
      return [];
    }

    const prisma = this.deps.prisma.getInstance();

    const zoneIds = params.territoireCodes.map((territoireCode) =>
      convertirTerritoireCodeEnZoneId(territoireCode),
    );

    const metricTypes = params.typesValeur.map((typeValeur) =>
      typeValeur === "VALEUR_INITIALE" ? "vi" : "vc",
    );

    const mesures = await prisma.mesure_indicateur.findMany({
      where: {
        indic_id: { in: params.indicateurIds },
        zone_id: { in: zoneIds },
        metric_type: { in: metricTypes },
        date_import: {
          gte: params.dateDebut,
          lte: params.dateFin,
        },
      },
    });

    if (mesures.length === 0) {
      return [];
    }

    const indicateurIds = [...new Set(mesures.map((m) => m.indic_id))];
    const indicateurs = await prisma.indicateur_identite.findMany({
      where: { id: { in: indicateurIds } },
      select: { id: true, nom: true },
    });
    const indicateurNomsMap = new Map(
      indicateurs.map((ind) => [ind.id, ind.nom]),
    );

    const territoireCodes = [
      ...new Set(
        mesures.map((m) => convertirZoneIdEnTerritoireCode(m.zone_id)),
      ),
    ];
    const territoires = await prisma.territoire.findMany({
      where: { code: { in: territoireCodes } },
      select: { code: true, nom: true },
    });
    const territoireNomsMap = new Map(
      territoires.map((terr) => [terr.code, terr.nom]),
    );

    return mesures.map((mesure) => {
      const territoireCode = convertirZoneIdEnTerritoireCode(mesure.zone_id);
      const typeValeur =
        mesure.metric_type === "vi" ? "VALEUR_INITIALE" : "VALEUR_CIBLE";

      return {
        id: mesure.id,
        indicateurId: mesure.indic_id,
        indicateurNom: indicateurNomsMap.get(mesure.indic_id) || "",
        territoireCode,
        territoireNom: territoireNomsMap.get(territoireCode) || "",
        typeValeur,
        dateValeur: new Date(mesure.metric_date),
        valeur: mesure.metric_value === "" ? null : Number(mesure.metric_value),
        dateImport: mesure.date_import ?? new Date(),
      };
    });
  }
}
