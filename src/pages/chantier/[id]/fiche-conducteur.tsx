import { FunctionComponent } from "react";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { createLoader, parseAsInteger } from "nuqs/server";
import assert from "node:assert";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { FicheConducteurContrat } from "@/server/fiche-conducteur/app/contrats/FicheConducteurContrat";
import { PageFicheConducteur } from "@/components/PageFicheConducteur/PageFicheConducteur";
import { RécupérerVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase";
import { estAutoriséAConsulterLaFicheConducteur } from "@/client/utils/fiche-conducteur/fiche-conducteur";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";

const loadSearchParams = createLoader({
  jalon: parseAsInteger,
});

export const getServerSideProps: GetServerSideProps<{
  ficheConducteur: FicheConducteurContrat;
  jalon: number;
}> = async (context) => {
  const { query } = context;
  const session = await auth(context);

  const estFicheConducteurDisponible =
    new RécupérerVariableContenuUseCase().run({
      nomVariableContenu: "NEXT_PUBLIC_FF_FICHE_CONDUCTEUR",
    });

  if (
    !estFicheConducteurDisponible ||
    !session ||
    !estAutoriséAConsulterLaFicheConducteur(session.profil)
  ) {
    throw new Error("Not connected or not authorized ?");
  }

  const id = context.params?.id;
  assert(typeof id === "string", "L'id du chantier est obligatoire");

  const searchParams = loadSearchParams(query);
  const jalon =
    searchParams.jalon ??
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );

  const ficheConducteur = await getContainer("ficheConducteur")
    .resolve("ficheConducteurHandler")
    .recupererFicheConducteur(id, "NAT-FR", jalon);

  return {
    props: {
      ficheConducteur,
      jalon,
    },
  };
};

const FicheConducteur: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ ficheConducteur, jalon }) => {
  return (
    <>
      <Head>
        <title>Fiche conducteur</title>
      </Head>
      <PageFicheConducteur {...ficheConducteur} jalon={jalon} />
    </>
  );
};

export default FicheConducteur;
