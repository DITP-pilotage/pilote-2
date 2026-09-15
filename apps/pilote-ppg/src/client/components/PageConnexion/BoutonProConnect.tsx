import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import { useEnv } from "@/client/hooks/useEnv";

type BoutonProConnectProps = {
  onClick: () => void;
};

/**
 * Bouton officiel ProConnect.
 *
 * Reprend le composant `fr-connect` du DSFR, dont le glyphe FranceConnect est
 * remplacé par celui de ProConnect via la surcharge `.proconnect-button`
 * définie dans app.scss. C'est la première des trois intégrations proposées par
 * la DINUM, celle destinée aux services déjà sous DSFR.
 *
 * Tant que le feature flip est fermé, le bouton reste affiché mais désactivé
 * pour annoncer l'arrivée de ProConnect.
 *
 * Source : https://github.com/proconnect-gouv/proconnect-documentation
 *          doc_fs/bouton_proconnect.md
 */
export const BoutonProConnect = ({ onClick }: BoutonProConnectProps) => {
  const ffProConnect = useEnv("NEXT_PUBLIC_FF_PROCONNECT");

  return (
    <div className="fr-connect-group text-center">
      <button
        aria-describedby={ffProConnect ? undefined : "proconnect-a-venir"}
        className="proconnect-button fr-connect"
        disabled={!ffProConnect}
        onClick={onClick}
        type="button"
      >
        <span className="fr-connect__login">S'identifier avec</span>
        <span className="fr-connect__brand">ProConnect</span>
      </button>
      {ffProConnect ? null : (
        <p className="fr-mt-1w fr-mb-1w">
          <span
            className="fr-badge fr-badge--sm fr-badge--info fr-badge--no-icon"
            id="proconnect-a-venir"
          >
            Bientôt disponible
          </span>
        </p>
      )}
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
};
