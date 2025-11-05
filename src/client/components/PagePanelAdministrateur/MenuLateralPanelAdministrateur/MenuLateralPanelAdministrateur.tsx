import React, { FunctionComponent } from "react";
import Link from "next/link";
import { clsxm } from "@/utils/clsxm";

interface MenuLateralPanelAdministrateurProps {
  pageActive: string;
}

const menuItems = [
  {
    label: "Paramétrage source indicateur",
    href: "/panel-administrateur/parametrage-source-indicateur",
    pageKey: "parametrage-source-indicateur",
  },
  {
    label: "🚧 Droits utilisateurs 🚧",
    href: "/panel-administrateur/droits-utilisateurs",
    pageKey: "metadata-chantier",
  },
  {
    label: "🚧 Metadata chantier 🚧",
    href: "/panel-administrateur/metadata-chantier",
    pageKey: "metadata-chantier",
  },
  {
    label: "🚧 Centre d'aide 🚧",
    href: "/panel-administrateur/centre-aide",
    pageKey: "centre-aide",
  },
  {
    label: "🚧 Nouveauté 🚧",
    href: "/panel-administrateur/nouveaute",
    pageKey: "nouveaute",
  },
  {
    label: "🚧 Feature flipping 🚧",
    href: "/panel-administrateur/feature-flipping",
    pageKey: "feature-flipping",
  },
] as const;

export const MenuLateralPanelAdministrateur: FunctionComponent<
  MenuLateralPanelAdministrateurProps
> = ({ pageActive }) => {
  return (
    <nav
      aria-label="Menu latéral"
      className="bg-white border-r border-gray-200 min-w-[250px] shrink-0"
      role="navigation"
    >
      <div className="p-4">
        <button
          aria-controls="fr-sidemenu-wrapper"
          aria-expanded="false"
          className="hidden"
          type="button"
        >
          Panel Administrateur
        </button>
        <div id="fr-sidemenu-wrapper">
          <div className="text-lg font-bold mb-4 text-gray-900">
            Panel Administrateur
          </div>
          <ul className="space-y-1 list-style-none !pl-0">
            {menuItems.map((item) => {
              const isActive = pageActive === item.pageKey;
              return (
                <li key={item.pageKey}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={clsxm(
                      `!block !px-4 !py-2 !rounded-md !transition-colors !bg-none`,
                      {
                        "!bg-blue-100 !text-blue-700 !font-medium": isActive,
                        "!text-gray-700 !hover:bg-gray-100": !isActive,
                      },
                    )}
                    href={item.href}
                    target="_self"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};
