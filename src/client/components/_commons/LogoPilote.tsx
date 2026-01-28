import Link from "next/link";
import { clsxm } from "@/utils/clsxm";

export const LogoPilote = ({ className }: { className?: string }) => (
  <div
    className={clsxm(
      "fr-header__logo flex items-center fr-col-10 fr-col-md-11 fr-col-lg-12",
      className,
    )}
  >
    <p className="fr-logo fr-mr-5v">Gouvernement</p>
    <div>
      <Link href="/" title="Retour à l'accueil du site">
        <p className="fr-header__service-title mb-0">PILOTE</p>
      </Link>
      <p className="fr-header__service-tagline fr-text--sm mb-0">
        Piloter l'action publique par les résultats
      </p>
    </div>
  </div>
);
