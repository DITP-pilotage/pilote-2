import type { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import { SelecteurVue } from "@/components/_commons/ChatUI/SelecteurVue";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import { clsxm } from "@/utils/clsxm";

const BOUTON_ICONE =
  "flex h-8 w-8 shrink-0 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

// En-tête commun aux trois vues. En version compacte (fenêtre, panneau), le
// contexte s'affiche sous l'en-tête plutôt qu'à côté du titre.
export const AlbertEnTete = ({
  titre,
  contexte,
  compact,
}: {
  titre: ReactNode;
  contexte?: ContexteAccueil;
  compact: boolean;
}) => {
  const { minimize, close } = useAlbertConversation();
  const tailleIcone = compact ? "h-[18px] w-[18px]" : "h-5 w-5";

  return (
    <div
      className={clsxm(
        "flex shrink-0 items-center border-b border-dsfr-grey-900",
        compact ? "h-12 gap-2.5 pl-3.5 pr-1.5" : "h-14 gap-3 pl-5 pr-4",
      )}
    >
      <AlbertMonogramme taille={compact ? "sm" : "md"} />
      {titre}
      {!compact && contexte ? (
        <span className="ml-2 inline-flex h-7 items-center gap-1.5 border border-dsfr-blue-france-925 bg-dsfr-blue-france-950 px-2.5 text-[13px] font-medium leading-5 text-primary">
          <Icone className="h-4 w-4" icone={MapPin2Icon} />
          {contexte.territoireNom} · Jalon {contexte.jalon}
        </span>
      ) : null}
      <span className="flex-1" />
      <SelecteurVue />
      <button
        aria-label="Réduire la conversation"
        className={BOUTON_ICONE}
        onClick={minimize}
        title="Réduire"
        type="button"
      >
        <Icone className={tailleIcone} icone={SubtractLineIcon} />
      </button>
      <button
        aria-label={`Fermer l'${NOM_ASSISTANT}`}
        className={BOUTON_ICONE}
        onClick={close}
        title="Fermer"
        type="button"
      >
        <Icone className={tailleIcone} icone={CloseLineIcon} />
      </button>
    </div>
  );
};
