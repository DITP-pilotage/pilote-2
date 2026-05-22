import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const MOTS_CLES_SYNTHESE = [
  "synthèse",
  "synthese",
  "état des lieux",
  "etat des lieux",
  "résume",
  "resume",
  "résumé",
  "resumé",
  "résumée",
  "point complet",
  "vue d'ensemble",
  "panorama",
];

const MOTS_CLES_DASHBOARD = [
  "dashboard",
  "cockpit",
  "tableau de bord",
  "widget",
  "cartographie",
  "carte",
  "vue",
  "affiche",
  "montre",
  "visualise",
  "indicateur",
  "indicateurs",
];

const MOTS_CLES_EXPORT = [
  "export",
  "exporter",
  "rapport",
  "télécharger",
  "telecharger",
  "télécharge",
  "telecharge",
  "pdf",
  "markdown",
];

const MOTS_CLES_SOUS_TERRITOIRES = [
  "et ses départements",
  "et ses departements",
  "et les départements qui",
  "et les departements qui",
  "et ses sous-territoires",
  "et ses sous territoires",
  "détaille par département",
  "detaille par departement",
  "détaillé par département",
  "décomposé par département",
  "decompose par departement",
  "décomposé par région",
  "decompose par region",
  "décomposé par sous-territoire",
  "decompose par sous-territoire",
  "et ses régions",
  "et ses regions",
  "par sous-territoire",
  "par sous territoire",
];

export interface Capacities {
  synthese: boolean;
  dashboard: boolean;
  exportRapport: boolean;
  inclureSousTerritoires: boolean;
}

export function detecterCapacities(message: string): Capacities {
  const normalise = message.toLowerCase();
  const contient = (motCle: string) => normalise.includes(motCle);
  return {
    synthese: MOTS_CLES_SYNTHESE.some(contient),
    dashboard: MOTS_CLES_DASHBOARD.some(contient),
    exportRapport: MOTS_CLES_EXPORT.some(contient),
    inclureSousTerritoires: MOTS_CLES_SOUS_TERRITOIRES.some(contient),
  };
}

export function extraireTexteDernierMessageUtilisateur(
  messages: PiloteUIMessage[],
): string {
  const dernierMessageUtilisateur = messages
    .filter((message) => message.role === "user")
    .at(-1);

  if (!dernierMessageUtilisateur) return "";

  return (dernierMessageUtilisateur.parts ?? [])
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join(" ");
}

export function dashboardDejaCompose(messages: PiloteUIMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === "assistant" &&
      (message.parts ?? []).some(
        (part) => part.type === "tool-create_dashboard",
      ),
  );
}
