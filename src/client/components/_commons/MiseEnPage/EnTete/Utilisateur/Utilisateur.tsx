import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { BoutonSeDeconnecter } from "@/components/_commons/BoutonSeDeconnecter";
import { clsxm } from "@/utils/clsxm";
import { Dropdown } from "@/components/shared/Dropdown";
import { BoutonPanelAdministrateur } from "@/components/_commons/BoutonPanelAdministrateur";

export const Utilisateur = ({ email }: { email: string }) => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);

  return (
    <Dropdown.Root onOpenChange={setEstDeplie} open={estDeplie}>
      <Dropdown.Trigger asChild>
        <button
          className="flex items-center !text-sm !p-0 !text-primary"
          name="Utilisateur connecté"
          type="button"
        >
          <Icone icone={Account1Icon} />
          <span className="pl-2 pr-1">{email}</span>
          <Icone
            className={clsxm(
              "transition-transform duration-200 ease-in-out",
              estDeplie ? "rotate-90" : "rotate-0",
            )}
            icone={ArrowSLine1Icon}
          />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
        <BoutonPanelAdministrateur />
        <BoutonSeDeconnecter />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
