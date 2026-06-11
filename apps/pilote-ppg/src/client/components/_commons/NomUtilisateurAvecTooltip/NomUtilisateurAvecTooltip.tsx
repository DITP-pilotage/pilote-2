import { useRef, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import SecureTooltip from "@/components/_commons/SecureTooltip/SecureTooltip";

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
  const [visible, setVisible] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        ref={anchorRef}
        className={clsxm("cursor-help underline decoration-dotted", className)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {nom}
      </span>
      <SecureTooltip
        anchorEl={anchorRef.current}
        classNameInfoBulle="!min-w-0 !max-w-[300px]"
        isVisible={visible}
      >
        <p className="text-sm mb-0">
          <span className="font-semibold">Service : </span>
          {service ?? "Non renseigné"}
        </p>
        <p className="text-sm mb-0">
          <span className="font-semibold">Fonction : </span>
          {fonction ?? "Non renseigné"}
        </p>
      </SecureTooltip>
    </>
  );
};
