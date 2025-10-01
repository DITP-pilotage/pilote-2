import React, { FunctionComponent } from "react";
import Link from "next/link";
import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";

interface MenuLateralPanelAdministrateurProps {
  pageActive: string;
}

export const MenuLateralPanelAdministrateur: FunctionComponent<
  MenuLateralPanelAdministrateurProps
> = ({ pageActive }) => {
  return (
    <nav
      aria-label="Menu latéral"
      className="fr-sidemenu"
      role="navigation"
      style={{ minWidth: "250px", flexShrink: 0 }}
    >
      <div className="fr-sidemenu__inner !p-4">
        <button
          aria-controls="fr-sidemenu-wrapper"
          aria-expanded="false"
          className="fr-sidemenu__btn"
          hidden
          type="button"
        >
          Panel Administrateur
        </button>
        <div className="fr-collapse" id="fr-sidemenu-wrapper">
          <div className="fr-sidemenu__title">Panel Administrateur</div>
          <ul className="fr-sidemenu__list">
            <li className="fr-sidemenu__item">
              <Link
                aria-current={
                  pageActive === "parametrage-source-indicateur"
                    ? "page"
                    : undefined
                }
                className="fr-sidemenu__link"
                href="/panel-administrateur/parametrage-source-indicateur"
                target="_self"
              >
                Paramétrage source indicateur
              </Link>
            </li>
            <li className="fr-sidemenu__item">
              <Link
                aria-current={
                  pageActive === "metadata-chantier" ? "page" : undefined
                }
                className="fr-sidemenu__link"
                href="/panel-administrateur/metadata-chantier"
                target="_self"
              >
                Metadata chantier
              </Link>
            </li>
            <li className="fr-sidemenu__item">
              <Link
                aria-current={pageActive === "centre-aide" ? "page" : undefined}
                className="fr-sidemenu__link"
                href="/panel-administrateur/centre-aide"
                target="_self"
              >
                Centre d'aide
              </Link>
            </li>
            <li className="fr-sidemenu__item">
              <Link
                aria-current={pageActive === "nouveaute" ? "page" : undefined}
                className="fr-sidemenu__link"
                href="/panel-administrateur/nouveaute"
                target="_self"
              >
                Nouveauté
              </Link>
            </li>
            <li className="fr-sidemenu__item">
              <Link
                aria-current={
                  pageActive === "feature-flipping" ? "page" : undefined
                }
                className="fr-sidemenu__link"
                href="/panel-administrateur/feature-flipping"
                target="_self"
              >
                Feature flipping
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
