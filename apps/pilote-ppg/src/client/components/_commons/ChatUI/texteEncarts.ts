import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export const OUTILS_ENCART = new Set([
  "tool-rediger_synthese_territoire",
  "tool-rediger_comparaison_territoires",
]);

/** Le texte des encarts d'une réponse, pour « Copier le texte ». */
export const texteEncarts = ({
  message,
}: {
  message: PiloteUIMessage;
}): string[] =>
  message.parts.flatMap((part) =>
    (part.type === "tool-rediger_synthese_territoire" ||
      part.type === "tool-rediger_comparaison_territoires") &&
    part.state === "output-available" &&
    !part.output.acces_refuse
      ? [part.output.markdown]
      : [],
  );
