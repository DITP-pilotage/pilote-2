import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import { FunctionComponent } from "react";
import BoutonImpressionStyled from "./BoutonImpression.styled";

const BoutonImpression: FunctionComponent = () => {
  return (
    <BoutonImpressionStyled>
      <button
        className="fr-link fr-link--icon-left fr-icon-printer-line fr-btn--icon-left fr-text--sm fr-p-0 border-b border-blue-france"
        onClick={() => window.print()}
        title="Imprimer"
        type="button"
      >
        Imprimer
      </button>
    </BoutonImpressionStyled>
  );
};

export default BoutonImpression;
