import { FunctionComponent } from "react";
import Link from "next/link";
import { useEnv } from "@/client/hooks/useEnv";

interface PageGestionContenu {
  nom: string;
  lien: string;
  accessible: boolean;
}

const MenuItemGestionContenu: FunctionComponent<{ urlActuelle: string }> = ({
  urlActuelle,
}) => {
  const ffGestionTokenAPI = useEnv("NEXT_PUBLIC_FF_GESTION_TOKEN_API");
  const pagesGestionContenu: PageGestionContenu[] = [
    {
      nom: "Message d'information",
      lien: "/admin/message-information",
      accessible: true,
    },
    {
      nom: "Token API",
      lien: "/admin/gestion-token-api",
      accessible: ffGestionTokenAPI,
    },
    {
      nom: "Nouveautés",
      lien: "/admin/nouveautes",
      accessible: false,
    },
    {
      nom: "Textes des infobulles",
      lien: "/admin/infobulles",
      accessible: false,
    },
    {
      nom: "Chantiers",
      lien: "/admin/chantiers",
      accessible: false,
    },
    {
      nom: "Indicateurs des chantiers",
      lien: "/admin/indicateurs",
      accessible: true,
    },
  ];
  return (
    <li className="fr-nav__item relative">
      <button
        aria-controls="menu-776"
        aria-current={pagesGestionContenu
          .map((page) => page.nom)
          .includes(urlActuelle)}
        aria-expanded="false"
        className="fr-nav__btn"
        type="button"
      >
        Gestion des contenus
      </button>
      <div className="fr-collapse fr-menu" id="menu-776">
        <ul className="fr-menu__list">
          {pagesGestionContenu.map((page) => {
            return page.accessible ? (
              <li key={page.lien}>
                <Link
                  aria-current={page.lien === urlActuelle ? "true" : undefined}
                  className="fr-nav__link"
                  href={page.lien}
                  target="_self"
                >
                  {page.nom}
                </Link>
              </li>
            ) : null;
          })}
        </ul>
      </div>
    </li>
  );
};

export default MenuItemGestionContenu;
