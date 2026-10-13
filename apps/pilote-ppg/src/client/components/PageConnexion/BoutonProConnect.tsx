import { Badge } from "@/components/shared/Badge";
import { useEnv } from "@/client/hooks/useEnv";

type BoutonProConnectProps = {
  onClick: () => void;
};

/**
 * Bouton officiel ProConnect.
 *
 * Reproduit le composant `fr-connect` du DSFR avec le glyphe ProConnect
 * (classes `.proconnect-*` définies dans app.css). C'est la première des trois
 * intégrations proposées par la DINUM, celle destinée aux services sous DSFR.
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
    <div className="proconnect-group text-center">
      <button
        aria-describedby={ffProConnect ? undefined : "proconnect-a-venir"}
        className="proconnect-button"
        disabled={!ffProConnect}
        onClick={onClick}
        type="button"
      >
        <span className="proconnect-button__login">S'identifier avec</span>
        <span className="proconnect-button__brand">ProConnect</span>
      </button>
      {ffProConnect ? null : (
        <p className="mt-2 mb-2">
          <Badge id="proconnect-a-venir" size="sm" variant="info">
            Bientôt disponible
          </Badge>
        </p>
      )}
      <p className="mb-0">
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
