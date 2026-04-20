import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";
import Link from "next/link";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import "nextra-theme-docs/style.css";
import "./nextra-theme-vars.css";
import "@/client/styles/app.scss";
import { NavigationFilterWrapper } from "./NavigationFilterWrapper";

const navbar = (
  <Navbar logo={<LogoPilote />} projectLink="">
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
      nextThemes={{ forcedTheme: "light" }}
      copyPageButton={false}
    >
      <NavigationFilterWrapper />
      {children}
    </Layout>
  );
}
