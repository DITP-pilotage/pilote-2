import type { DocsThemeConfig } from "nextra-theme-docs";
import Link from "next/link";
import { NavigationFilter } from "@/client/components/CentreAide/NavigationFilter";

const config: DocsThemeConfig = {
  logo: (
    <div className="flex items-center gap-4">
      <p className="fr-logo !text-sm">Gouvernement</p>
      <div className="flex flex-col">
        <span className="!text-xl bold">PILOTE</span>
        <span className="!text-sm">
          Piloter l&#39;action publique par les résultats
        </span>
      </div>
    </div>
  ),
  navbar: {
    extraContent: () => (
      <div className="flex align-center gap-4 ml-4 border-l pl-4">
        <Link
          className="!text-dsfr-blue-link"
          href="mailto:pilote.ditp@modernisation.gouv.fr"
        >
          Contacter l&#39;équipe Pilote
        </Link>
        <Link className="!text-dsfr-blue-link" href="/">
          Accéder à Pilote
        </Link>
      </div>
    ),
  },
  docsRepositoryBase:
    "https://github.com/DITP-pilotage/pilote-2/tree/dev/src/pages/centreaide",
  head: (
    <>
      <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      <meta
        content="Documentation et centre d'aide pour PILOTE"
        name="description"
      />
    </>
  ),
  navigation: {
    prev: true,
    next: true,
  },
  footer: {
    content: `${new Date().getFullYear()} © DITP - Pilotage`,
  },
  feedback: {
    content: null,
  },
  search: {
    placeholder: "Rechercher dans la documentation...",
  },
  darkMode: false,
  editLink: {
    component: null,
  },
  nextThemes: {
    defaultTheme: "light",
    forcedTheme: "light",
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: false,
  },
  toc: {
    title: "Sur cette page",
    backToTop: () => {
      return <span>Revenir en haut</span>;
    },
  },
  main: ({ children }) => {
    return (
      <>
        <NavigationFilter />
        {children}
      </>
    );
  },
};

export default config;
