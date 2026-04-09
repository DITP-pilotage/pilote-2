import { FunctionComponent, useMemo, useState } from "react";
import Link from "next/link";
import { useEnv } from "@/client/hooks/useEnv";
import { clsxm } from "@/utils/clsxm";

interface MenuLateralPanelAdministrateurProps {
  pageActive: string;
}

export const MenuLateralPanelAdministrateur: FunctionComponent<
  MenuLateralPanelAdministrateurProps
> = ({ pageActive }) => {
  const [estReplie, setEstReplie] = useState(false);
  const ffGestionTokenAPI = useEnv("NEXT_PUBLIC_FF_GESTION_TOKEN_API");
  const ffCentreAide = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN");

  const menuItems = useMemo(
    () => [
      {
        label: "Message d'information",
        href: "/panel-administrateur/message-information",
        pageKey: "message-information",
      },
      ...(ffGestionTokenAPI
        ? [
            {
              label: "Token API",
              href: "/panel-administrateur/gestion-token-api",
              pageKey: "gestion-token-api",
            },
          ]
        : []),
      {
        label: "Indicateurs des chantiers",
        href: "/panel-administrateur/indicateurs",
        pageKey: "indicateurs",
      },
      {
        label: "Paramétrage metadata indicateur",
        href: "/panel-administrateur/parametrage-metadata-indicateur",
        pageKey: "parametrage-metadata-indicateur",
      },
      {
        label: "🚧 Paramétrage metadata chantier 🚧",
        href: "/panel-administrateur/parametrage-metadata-chantier",
        pageKey: "metadata-chantier",
      },
      {
        label: "Habilitations coordinateurs",
        href: "/panel-administrateur/habilitations-coordinateur",
        pageKey: "habilitations-coordinateur",
      },
      {
        label: "Nouveautés",
        href: "/panel-administrateur/nouveaute",
        pageKey: "nouveaute",
      },
      ...(ffCentreAide
        ? [
            {
              label: "Centre d'aide",
              href: "/panel-administrateur/centre-aide",
              pageKey: "centre-aide",
            },
          ]
        : []),
      {
        label: "Albert",
        href: "/panel-administrateur/albert",
        pageKey: "albert",
      },
      {
        label: "Feature flipping",
        href: "/panel-administrateur/feature-flipping",
        pageKey: "feature-flipping",
      },
      {
        label: "Logs applicatifs",
        href: "/panel-administrateur/logs",
        pageKey: "logs",
      },
    ],
    [ffGestionTokenAPI, ffCentreAide],
  );

  return (
    <nav
      aria-label="Menu latéral"
      className={clsxm(
        "bg-white border-r border-gray-200 shrink-0 relative transition-all duration-200",
        estReplie ? "w-[48px]" : "min-w-[250px]",
      )}
      role="navigation"
    >
      <button
        aria-controls="menu-lateral-contenu"
        aria-expanded={!estReplie}
        aria-label={estReplie ? "Déplier le menu" : "Replier le menu"}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 shadow-sm"
        onClick={() => setEstReplie(!estReplie)}
        title={estReplie ? "Déplier le menu" : "Replier le menu"}
        type="button"
      >
        <svg
          className={clsxm(
            "w-3 h-3 transition-transform duration-200",
            estReplie && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M15 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {!estReplie && (
        <div className="p-4" id="menu-lateral-contenu">
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
      )}
    </nav>
  );
};
