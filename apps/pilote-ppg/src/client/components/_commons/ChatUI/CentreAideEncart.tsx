import { useId } from "react";
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import { Icone } from "@/components/_commons/Icone";
import { ArrowRightLineIcon } from "@/components/_commons/Icones/ArrowRightLineIcon";
import { Book2ContourIcon } from "@/components/_commons/Icones/Book2ContourIcon";
import { LienInterneAssistant } from "@/components/_commons/ChatUI/AssistantMessageText";
import {
  helpCenterContactEvent,
  helpCenterLinkEvent,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";

/**
 * L'agent peut consulter le centre d'aide plusieurs fois dans un tour : seul
 * le dernier résultat ferme la réponse.
 */
export const derniereConsultationCentreAide = (
  parts: PiloteUIMessage["parts"],
): ConsulterCentreAideOutput | null =>
  (parts ?? []).reduce<ConsulterCentreAideOutput | null>(
    (derniere, part) =>
      part.type === "tool-consulter_centre_aide" &&
      part.state === "output-available"
        ? part.output
        : derniere,
    null,
  );

export const CentreAideEncart = ({
  output,
}: {
  output: ConsulterCentreAideOutput;
}) => {
  const idTitre = useId();
  const track = useChatTracking();

  if (!output.trouve || output.sources.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2.5 border border-dsfr-grey-925 bg-dsfr-grey-1000 px-3.5 py-3">
        <p className="mb-0 text-[13px] leading-5 text-dsfr-mention-grey">
          Une question sur PILOTE que le centre d&apos;aide ne couvre pas ?
          L&apos;équipe PILOTE vous répond par mail.
        </p>
        <BoutonContacterEquipePilote
          onClick={() => track(helpCenterContactEvent)}
          variant="secondary"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p
        className="mb-0 flex items-center gap-1.5 text-[13px] font-bold leading-5 text-dsfr-grey-200"
        id={idTitre}
      >
        <Icone className="h-4 w-4 text-primary" icone={Book2ContourIcon} />
        Pour plus d&apos;informations
      </p>
      <ul
        aria-labelledby={idTitre}
        className="m-0 flex list-none flex-col border border-dsfr-grey-925 p-0"
      >
        {output.sources.map((source) => (
          <li
            className="border-t border-dsfr-grey-925 p-0 first:border-t-0"
            key={source.id}
          >
            {/* Sans libellé, le nom lu colle l'emplacement et le titre. */}
            <LienInterneAssistant
              className="flex items-center gap-3 bg-none px-3 py-2.5 hover:bg-dsfr-alt-blue-france"
              event={helpCenterLinkEvent}
              href={source.url}
              libelle={
                source.chemin.length > 0
                  ? `${source.titre}, dans ${source.chemin.join(" › ")}`
                  : source.titre
              }
            >
              <span className="flex flex-col">
                {source.chemin.length > 0 && (
                  <span className="text-xs leading-[18px] text-dsfr-mention-grey">
                    {source.chemin.join(" › ")}
                  </span>
                )}
                <span className="text-sm font-semibold leading-5 text-primary">
                  {source.titre}
                </span>
              </span>
              <Icone
                className="ml-auto h-[18px] w-[18px] shrink-0 text-primary"
                icone={ArrowRightLineIcon}
              />
            </LienInterneAssistant>
          </li>
        ))}
      </ul>
    </div>
  );
};
