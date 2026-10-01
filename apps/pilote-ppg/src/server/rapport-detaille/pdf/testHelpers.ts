import { Content } from "pdfmake/interfaces";
import { pdfmake } from "@/server/pdf/pdfmake";
import {
  buildRapportDetailleContext,
  RapportDetailleQuery,
} from "@/server/rapport-detaille/rapportDetailleContext";
import { buildTestSession } from "@/server/rapport-detaille/testSession";
import {
  ChantierDetail,
  VueDEnsembleRapportDetaille,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import { TERRITOIRE_NATIONAL } from "@/server/rapport-detaille/testData";

export function collectTexts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectTexts);
  if (typeof value !== "object" || value === null) return [];
  if ("svg" in value) return [];
  return Object.entries(value).flatMap(([key, entry]) =>
    key === "text" ||
    key === "stack" ||
    key === "columns" ||
    key === "table" ||
    key === "body" ||
    key === "ul" ||
    key === "ol"
      ? collectTexts(entry)
      : [],
  );
}

export function textOf(content: Content): string {
  return collectTexts(content).join(" ").replace(/\s+/g, " ");
}

export async function renderPdf(content: Content): Promise<string> {
  const buffer = await pdfmake
    .createPdf({ content, defaultStyle: { font: "Marianne" } })
    .getBuffer();
  return buffer.subarray(0, 4).toString();
}

export function buildTestContext(
  query: RapportDetailleQuery = {},
  territoireCode = "NAT-FR",
) {
  return buildRapportDetailleContext(
    query,
    territoireCode,
    buildTestSession({
      habilitations: {
        ...buildTestSession().habilitations,
        lecture: {
          ...buildTestSession().habilitations.lecture,
          chantiers: ["CH-001"],
          territoires: ["NAT-FR", "REG-11", "DEPT-75"],
        },
      },
    }),
    new Date("2026-10-01T07:05:00Z"),
  );
}

export function buildTestVueDEnsemble(
  overrides: Partial<VueDEnsembleRapportDetaille> = {},
): VueDEnsembleRapportDetaille {
  return {
    chantiers: [],
    ministères: [],
    axes: [],
    selectedTerritoire: TERRITOIRE_NATIONAL,
    filtresComptesCalculés: {
      estEnAlerteTauxAvancementNonCalculé: 1,
      estEnAlerteÉcart: 2,
      estEnAlerteBaisse: 3,
      estEnAlerteMétéoNonRenseignée: 4,
      estEnAlerteAbscenceTauxAvancementDepartemental: 5,
      estEnAlertePossedePropositionsValeurAvancement: 6,
    },
    avancementsAgrégés: { médiane: 50, minimum: 10, maximum: 90 },
    avancementsGlobauxTerritoriauxMoyens: [],
    repartitionMeteosChantiers: { ORAGE: 1, NUAGE: 2, COUVERT: 3, SOLEIL: 4 },
    moyenneTauxAvancementTerritoire: 42,
    estAutoriseAVoirLesBrouillons: false,
    chantiersSontArchives: false,
    ...overrides,
  };
}

export function buildTestChantierDetail(
  overrides: Partial<ChantierDetail> = {},
): ChantierDetail {
  return {
    chantierId: "CH-001",
    avancement: {
      nationale: {
        global: {
          moyenne: 40,
          médiane: 45,
          minimum: 10,
          maximum: 90,
          date: null,
        },
        annuel: { moyenne: 55, date: "2026-06-30T00:00:00Z" },
      },
      departementale: {
        global: { moyenne: 30, date: null },
        annuel: { moyenne: 35, date: "2026-06-30T00:00:00Z" },
      },
      regionale: {
        global: { moyenne: 20, date: null },
        annuel: { moyenne: 25, date: "2026-06-30T00:00:00Z" },
      },
    },
    indicateurs: [],
    détailsIndicateurs: {},
    synthèseDesRésultats: null,
    objectifs: [],
    commentaires: [],
    décisionStratégique: null,
    donnéesCartographieAvancement: [],
    donnéesCartographieMétéo: [],
    listeIndicateursPrisEnCompteAvancement: [],
    ...overrides,
  };
}
