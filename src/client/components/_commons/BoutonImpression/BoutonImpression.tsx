import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const BoutonImpression = ({ className }: ButtonHTMLAttributes<"button">) => {
  return (
    <button
      className={clsx(
        "fr-link fr-link--icon-left fr-icon-printer-line fr-btn--icon-left fr-text--sm fr-p-0 border-b border-blue-france",
        className,
      )}
      onClick={() => window.print()}
      title="Imprimer"
      type="button"
    >
      Imprimer
    </button>
  );
};

export default BoutonImpression;
