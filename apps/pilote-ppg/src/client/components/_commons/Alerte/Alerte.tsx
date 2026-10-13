import { FunctionComponent } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CheckboxCircleFillIcon } from "@/components/_commons/Icones/CheckboxCircleFillIcon";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { clsxm } from "@/utils/clsxm";
import AlerteProps, { typeAlerte } from "./Alerte.interface";

// Reproduit le composant « Alerte » du DSFR : fond blanc, bordure et bande
// latérale à la couleur du type, icône blanche dans la bande.
const VARIANTES: Record<
  typeAlerte,
  {
    couleur: "info" | "success" | "warning" | "error";
    bordure: string;
    bande: string;
    icone: typeof InformationPleineIcon;
  }
> = {
  info: {
    couleur: "info",
    bordure: "border-dsfr-info-425",
    bande: "bg-dsfr-info-425",
    icone: InformationPleineIcon,
  },
  succès: {
    couleur: "success",
    bordure: "border-dsfr-success-425",
    bande: "bg-dsfr-success-425",
    icone: CheckboxCircleFillIcon,
  },
  warning: {
    couleur: "warning",
    bordure: "border-dsfr-warning-425",
    bande: "bg-dsfr-warning-425",
    icone: WarningIcon,
  },
  erreur: {
    couleur: "error",
    bordure: "border-dsfr-error-425",
    bande: "bg-dsfr-error-425",
    icone: CloseCircleIcon,
  },
};

const Alerte: FunctionComponent<AlerteProps> = ({
  type,
  titre,
  message,
  classesSupplementaires,
  classesMessagePolice,
  children,
}) => {
  const variante = VARIANTES[type];

  return (
    <div
      className={clsxm(
        "flex bg-white border border-solid",
        variante.bordure,
        classesSupplementaires,
      )}
      data-color={variante.couleur}
      role={type === "info" || type === "succès" ? "status" : "alert"}
    >
      <div
        aria-hidden="true"
        className={clsxm(
          "flex shrink-0 justify-center w-10 pt-4",
          variante.bande,
        )}
      >
        <Icone className="w-6 h-6 text-white" icone={variante.icone} />
      </div>
      <div className="flex-1 pt-4 pb-3 pl-4 pr-9 [&_h3]:mb-1 [&_h3]:text-xl [&_h3]:leading-7 [&_h3]:font-bold [&_p:last-child]:mb-0">
        {!!titre && <h3>{titre}</h3>}
        {message ? (
          <p className={clsxm("mb-0", classesMessagePolice)}>{message}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default Alerte;
