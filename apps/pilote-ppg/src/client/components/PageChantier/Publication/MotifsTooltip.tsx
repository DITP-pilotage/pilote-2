import { ReactElement, useState } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";
import { Tooltip } from "@/components/shared/Tooltip";

// Le bouton reste focusable (aria-disabled plutôt que disabled) pour que
// l'infobulle s'affiche au survol comme au clavier.
export const MotifsTooltip = ({
  motifs,
  children,
}: {
  motifs: string[];
  children: ReactElement;
}) => {
  const [ouvert, setOuvert] = useState(false);

  // Sans motif, l'infobulle reste fermée : Radix n'ajoute alors pas
  // d'aria-describedby pointant vers un contenu absent.
  return (
    <Tooltip.Root open={ouvert && motifs.length > 0} onOpenChange={setOuvert}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      {motifs.length > 0 ? (
        <Tooltip.Content>
          {motifs.map((motif) => (
            <p className="mb-0" key={motif}>
              {motif}
            </p>
          ))}
        </Tooltip.Content>
      ) : null}
    </Tooltip.Root>
  );
};
