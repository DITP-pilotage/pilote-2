import { useState } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";
import { clsxm } from "@/utils/clsxm";
import { Tooltip } from "@/components/shared/Tooltip";

interface NomUtilisateurAvecTooltipProps {
  nom: string;
  service: string | null;
  fonction: string | null;
  className?: string;
}

export const NomUtilisateurAvecTooltip = ({
  nom,
  service,
  fonction,
  className,
}: NomUtilisateurAvecTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider>
      <Tooltip.Root onOpenChange={setOpen} open={open}>
        <Tooltip.Trigger
          className={clsxm("inline underline hover:bg-transparent", className)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {nom}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <RadixTooltip.Content
            className="z-50 max-w-[400px] text-dsfr-grey-50 bg-dsfr-alt-blue-france rounded-lg p-3 border border-primary"
            sideOffset={5}
          >
            <p className="text-sm mb-0">
              <span className="font-semibold">Service : </span>
              {service ?? "Non renseigné"}
            </p>
            <p className="text-sm mb-0">
              <span className="font-semibold">Fonction : </span>
              {fonction ?? "Non renseigné"}
            </p>
            <RadixTooltip.Arrow />
          </RadixTooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
