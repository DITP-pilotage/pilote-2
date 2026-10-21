import { PILOTE_TEAM_EMAIL } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";

const CONTACT_EQUIPE_PILOTE = `Contacter l'équipe PILOTE : ${PILOTE_TEAM_EMAIL}`;

/**
 * L'encart du centre d'aide en texte brut, pour « Copier » : le collage n'a
 * que le texte quand la réponse n'a pas de dashboard. Les adresses sont
 * absolues pour rester valides une fois collées.
 */
export const texteCopieCentreAide = ({
  output,
  origine,
}: {
  output: ConsulterCentreAideOutput;
  origine: string;
}): string => {
  if (!output.trouve || output.sources.length === 0) {
    return CONTACT_EQUIPE_PILOTE;
  }

  return [
    "Pour plus d'informations :",
    ...output.sources.map(
      (source) => `- ${source.titre} : ${origine}${source.url}`,
    ),
  ].join("\n");
};
