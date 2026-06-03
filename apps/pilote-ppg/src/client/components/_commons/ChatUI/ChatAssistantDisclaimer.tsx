import { Callout } from "@/components/shared/Callout";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";

export const ChatAssistantDisclaimer = () => (
  <div className="shrink-0 px-4 pt-2 bg-white">
    <div className="max-w-3xl mx-auto">
      <Callout.Root color="moutarde">
        <Callout.Icon icone={WarningIcon} />
        <Callout.Text>
          <p className="font-semibold mb-0">
            L&apos;Assistant peut faire des erreurs. Veuillez vérifier toutes
            les informations importantes.
          </p>
        </Callout.Text>
      </Callout.Root>
    </div>
  </div>
);
