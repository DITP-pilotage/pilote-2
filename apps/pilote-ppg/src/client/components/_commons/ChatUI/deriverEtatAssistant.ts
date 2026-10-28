import type { ChatStatus } from "ai";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { OUTILS_ENCART } from "@/components/_commons/ChatUI/texteEncarts";

export type EtatAssistant =
  | "reflechit"
  | "consulte-les-sources"
  | "consulte-le-centre-d-aide"
  | "redige"
  | "compose-le-tableau-de-bord"
  | "redige-l-encart";

export const LIBELLES_ETAT_ASSISTANT: Record<EtatAssistant, string> = {
  reflechit: "réfléchit",
  "consulte-les-sources": "consulte les sources",
  "consulte-le-centre-d-aide": "consulte le centre d'aide",
  redige: "rédige",
  "compose-le-tableau-de-bord": "compose le tableau de bord",
  "redige-l-encart": "rédige la synthèse",
};

const OUTILS_TABLEAU_DE_BORD = new Set([
  "tool-create_dashboard",
  "tool-compose_dashboard",
]);

/**
 * Déduit ce que l'assistant est en train de faire à partir de la dernière
 * part du message en cours de génération. Sert au libellé affiché sous sa
 * signature.
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

  // Les résultats intermédiaires de l'encart arrivent pendant sa rédaction
  if (
    OUTILS_ENCART.has(derniere.type) &&
    derniere.state === "output-available" &&
    "preliminary" in derniere &&
    derniere.preliminary
  ) {
    return "redige-l-encart";
  }

  const enCours =
    derniere.state === "input-streaming" ||
    derniere.state === "input-available";
  if (!enCours) return "reflechit";

  if (OUTILS_ENCART.has(derniere.type)) return "redige-l-encart";
  if (derniere.type === "tool-consulter_centre_aide") {
    return "consulte-le-centre-d-aide";
  }
  if (OUTILS_TABLEAU_DE_BORD.has(derniere.type)) {
    return "compose-le-tableau-de-bord";
  }
  return "consulte-les-sources";
};

/**
 * L'indicateur d'attente affiché sous la question, avant toute réponse. Dès
 * son premier morceau, le SDK ajoute la réponse, vide, sans quitter le statut
 * « submitted » : sa signature dit alors « réfléchit », et l'indicateur à part
 * ferait doublon.
 */
export const afficherAttenteReponse = ({
  status,
  messages,
}: {
  status: ChatStatus;
  messages: PiloteUIMessage[];
}): boolean => status === "submitted" && messages.at(-1)?.role === "user";
