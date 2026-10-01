import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import assert from "node:assert/strict";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import PageRapportDétaillé from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { loadBootstrap } from "@/server/app/bootstrap/loadBootstrap";
import type { Bootstrap } from "@/components/_commons/Bootstrap/BootstrapContext";
import { buildRapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  loadVueDEnsemble,
  withoutMailles,
} from "@/server/rapport-detaille/loadVueDEnsemble";
import { loadChantierDetails } from "@/server/rapport-detaille/loadChantierDetails";
import {
  ChantierDetail,
  SerializedVueDEnsemble,
} from "@/server/rapport-detaille/rapportDetaille.interface";

interface NextPageRapportDétailléProps extends Bootstrap {
  vueDEnsemble: SerializedVueDEnsemble;
  details: ChantierDetail[];
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  jalon: number;
}

export const getServerSideProps: GetServerSideProps<
  NextPageRapportDétailléProps
> = async (context) => {
  const { query } = context;
  const session = await auth(context);

  assert(query.territoireCode, "Le territoire code est manquant");
  assert(session, "Vous devez être authentifié pour accéder a cette page");
  assert(session.habilitations, "La session ne dispose d'aucune habilitation");
  const territoireCode = query.territoireCode as string;

  const rapportContext = buildRapportDetailleContext(
    query,
    territoireCode,
    session,
  );

  const [vueDEnsemble, bootstrap] = await Promise.all([
    loadVueDEnsemble(rapportContext),
    loadBootstrap(session),
  ]);
  const details = await loadChantierDetails(
    vueDEnsemble.chantiers,
    rapportContext,
    vueDEnsemble.selectedTerritoire,
  );

  return {
    props: {
      ...bootstrap,
      vueDEnsemble: {
        ...vueDEnsemble,
        chantiers: vueDEnsemble.chantiers.map(withoutMailles),
      },
      details,
      mailleSelectionnee: rapportContext.selectedMaille,
      territoireCode,
      jalon: rapportContext.jalon,
    },
  };
};

const NextPageRapportDétaillé: FunctionComponent<
  NextPageRapportDétailléProps
> = ({ vueDEnsemble, details, mailleSelectionnee, territoireCode, jalon }) => {
  return (
    <>
      <Head>
        <title>Rapport détaillé - PILOTE</title>
      </Head>
      <PageRapportDétaillé
        details={details}
        jalon={jalon}
        mailleSelectionnee={mailleSelectionnee}
        territoireCode={territoireCode}
        vueDEnsemble={vueDEnsemble}
      />
    </>
  );
};

export default NextPageRapportDétaillé;
