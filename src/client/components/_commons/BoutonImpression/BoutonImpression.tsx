import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import { ButtonHTMLAttributes } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { Printer1Icon } from "@/components/_commons/Icones/Printer1Icon";

export const BoutonImpression = ({
  className,
}: ButtonHTMLAttributes<"button">) => {
  return (
    <button
      className={clsxm(
        "!text-sm flex align-center gap-1 !pl-0 pb-0.5 border-b !border-blue-france !text-primary",
        className,
      )}
      onClick={() => window.print()}
      title="Imprimer"
      type="button"
    >
      <Icone className="w-4 h-4 !text-current" icone={Printer1Icon} />
      Imprimer
    </button>
  );
};

export default BoutonImpression;
