import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Account1Icon } from "@/components/_commons/Icones/Account1Icon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { BoutonSeDeconnecter } from "@/components/_commons/BoutonSeDeconnecter";
import { clsxm } from "@/utils/clsxm";

export const Utilisateur = ({ email }: { email: string }) => {
  const [estDeplie, setEstDeplie] = useState<boolean>(false);

  return (
    <div className="flex flex-column">
      <button
        className="flex flex-end fr-text--sm !p-0 !text-primary"
        name="Utilisateur connecté"
        onClick={() => setEstDeplie(!estDeplie)}
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
      {estDeplie ? (
        <div>
          <BoutonSeDeconnecter />
        </div>
      ) : null}
    </div>
  );
};
