import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";
import Link from "next/link";
import "nextra-theme-docs/style.css";
import "./nextra-theme-vars.css";
import "@/client/styles/app.scss";
import { NavigationFilterWrapper } from "./NavigationFilterWrapper";

const navbar = (
  <Navbar
    logo={
      <div className="flex items-center gap-4">
        <p className="fr-logo !text-sm">Gouvernement</p>
        <div className="flex flex-col">
          <span className="!text-xl bold">PILOTE</span>
          <span className="!text-sm">
            Piloter l&#39;action publique par les résultats
          </span>
        </div>
      </div>
    }
    projectLink=""
  >
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
  </Navbar>
);

const footer = (
  <Footer>{`${new Date().getFullYear()} © DITP - Pilotage`}</Footer>
);

export default async function CentreAideLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = await getPageMap("/centre-aide-pilote-2");

  return (
    <Layout
      navbar={navbar}
      pageMap={pageMap}
      footer={footer}
      feedback={{ content: null }}
      editLink={null}
      sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: false }}
      toc={{
        title: "Sur cette page",
        backToTop: true,
      }}
      darkMode={false}
    >
      <NavigationFilterWrapper />
      {children}
    </Layout>
  );
}
