import "@gouvfr/dsfr/dist/component/connect/connect.min.css";
import { FunctionComponent } from "react";

/**
 * Bouton officiel ProConnect.
 *
 * Reprend le composant `fr-connect` du DSFR, dont le glyphe FranceConnect est
 * remplacé par celui de ProConnect via la surcharge `.proconnect-button`
 * définie dans app.scss. C'est la première des trois intégrations proposées par
 * la DINUM, celle destinée aux services déjà sous DSFR.
 *
 * Source : https://github.com/proconnect-gouv/proconnect-documentation
 *          doc_fs/bouton_proconnect.md
 */
export const BoutonProConnect: FunctionComponent<{ onClick: () => void }> = ({
  onClick,
}) => (
  <div className="fr-connect-group text-center">
    <button
      className="proconnect-button fr-connect"
      onClick={onClick}
      type="button"
    >
      <span className="fr-connect__login">S'identifier avec</span>
      <span className="fr-connect__brand">ProConnect</span>
    </button>
    <p className="fr-mb-0">
      <a
        href="https://www.proconnect.gouv.fr/"
        rel="noopener noreferrer"
        target="_blank"
        title="Qu'est-ce que ProConnect ? - nouvelle fenêtre"
      >
        Qu'est-ce que ProConnect ?
      </a>
    </p>
  </div>
);
