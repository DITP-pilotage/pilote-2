import { Fragment } from "react";
import { DropdownMenu } from "radix-ui";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import {
  VUES_ASSISTANT,
  type VueAssistant,
} from "@/components/_commons/ChatUI/affichageAssistant";
import { PictogrammeVue } from "@/components/_commons/ChatUI/PictogrammeVue";

const LIBELLES: Record<VueAssistant, string> = {
  sidePanel: "Panneau latéral",
  floating: "Fenêtre flottante",
  modal: "Plein écran",
};

const ORDRE: readonly VueAssistant[] = ["sidePanel", "floating", "modal"];

const estVue = (valeur: string): valeur is VueAssistant =>
  (VUES_ASSISTANT as readonly string[]).includes(valeur);

export const MenuVue = () => {
  const { display, vuesDisponibles, changerVue } = useAlbertConversation();

  // Sur un écran étroit, le plein écran est la seule vue possible.
  if (vuesDisponibles.length < 2 || !estVue(display)) return null;

  const vues = ORDRE.filter((vue) => vuesDisponibles.includes(vue));

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={`Affichage : ${LIBELLES[display]}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france data-[state=open]:bg-dsfr-blue-france-950"
        title="Affichage"
      >
        <PictogrammeVue vue={display} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-[1800] w-56 border border-dsfr-grey-900 bg-white p-1.5 shadow-lg"
          sideOffset={6}
        >
          <DropdownMenu.RadioGroup
            onValueChange={(valeur) => {
              if (estVue(valeur) && valeur !== display) changerVue(valeur);
            }}
            value={display}
          >
            {vues.map((vue) => (
              <Fragment key={vue}>
                {vue === "modal" && vues.length > 1 ? (
                  <DropdownMenu.Separator className="my-1.5 h-px bg-dsfr-grey-925" />
                ) : null}
                <DropdownMenu.RadioItem
                  className="flex h-9 cursor-pointer items-center gap-2.5 px-2 text-sm text-dsfr-grey-50 outline-none data-[highlighted]:bg-dsfr-alt-blue-france data-[state=checked]:font-medium"
                  value={vue}
                >
                  <PictogrammeVue className="text-primary" vue={vue} />
                  <span className="flex-1">{LIBELLES[vue]}</span>
                  <DropdownMenu.ItemIndicator>
                    <Icone
                      className="h-4 w-4 text-primary"
                      icone={CheckLineIcon}
                    />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              </Fragment>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
