import type { ChatStatus } from "ai";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type EtatAssistant =
  | "reflechit"
  | "consulte-les-sources"
  | "redige"
  | "compose-le-tableau-de-bord"
  | "genere-le-rapport";

export const LIBELLES_ETAT_ASSISTANT: Record<EtatAssistant, string> = {
  reflechit: "réfléchit",
  "consulte-les-sources": "consulte les sources",
  redige: "rédige",
  "compose-le-tableau-de-bord": "compose le tableau de bord",
  "genere-le-rapport": "génère le rapport",
};

const OUTILS_TABLEAU_DE_BORD = new Set([
  "tool-create_dashboard",
  "tool-compose_dashboard",
]);

/**
 * Déduit ce qu'Albert est en train de faire à partir de la dernière part du
 * message en cours de génération. Sert au libellé affiché sous sa signature.
 */
export const deriverEtatAssistant = ({
  message,
  status,
}: {
  message: PiloteUIMessage | undefined;
  status: ChatStatus;
}): EtatAssistant | null => {
  if (status === "submitted") return "reflechit";
  if (status !== "streaming") return null;

  const derniere = message?.parts?.[message.parts.length - 1];
  if (!derniere) return "reflechit";

  if (derniere.type === "text") {
    return derniere.text.length > 0 ? "redige" : "reflechit";
  }

  if (!derniere.type.startsWith("tool-") || !("state" in derniere)) {
    return "reflechit";
  }

  const enCours =
    derniere.state === "input-streaming" ||
    derniere.state === "input-available";
  if (!enCours) return "reflechit";

  if (derniere.type === "tool-export_rapport") return "genere-le-rapport";
  if (OUTILS_TABLEAU_DE_BORD.has(derniere.type)) {
    return "compose-le-tableau-de-bord";
  }
  return "consulte-les-sources";
};
