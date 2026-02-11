import { FunctionComponent } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";
import assert from "node:assert";
import { PageFicheTerritoriale } from "@/components/PageFicheTerritoriale/PageFicheTerritoriale";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { ficheTerritorialeHandler } from "@/server/fiche-territoriale/infrastructure/handlers/FicheTerritorialeHandler";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration, configurationFeatureFlip } from "@/config";

const loadSearchParams = createLoader({
  jalon: parseAsInteger,
  territoireCode: parseAsString,
});

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  if (!configurationFeatureFlip().ficheTerritoriale) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const searchParams = loadSearchParams(query);
  const queryTerritoireCode = searchParams.territoireCode;

  assert(queryTerritoireCode, "Le territoire code est obligatoire");

  const session = await auth(context);

  assert(session);

  if (!estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error("Not connected or not authorized ?");
  }

  if (queryTerritoireCode === "NAT-FR") {
    throw new Error("Veuillez choisir un département ou une région");
  }

  const jalon =
    searchParams.jalon ??
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );

  const ficheTerritoriale =
    await ficheTerritorialeHandler().recupererFicheTerritoriale(
      queryTerritoireCode,
      jalon,
    );

  return {
    props: {
      ficheTerritoriale,
      jalon,
    },
  };
};

const FicheTerritoriale: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ ficheTerritoriale, jalon }) => {
  return (
    <PageFicheTerritoriale
      avancementAnnuelTerritoire={ficheTerritoriale.avancementAnnuelTerritoire}
      avancementGlobalTerritoire={ficheTerritoriale.avancementGlobalTerritoire}
      chantiersFicheTerritoriale={ficheTerritoriale.chantiersFicheTerritoriale}
      jalon={jalon}
      répartitionMétéos={ficheTerritoriale.répartitionMétéos}
      territoire={ficheTerritoriale.territoire}
    />
  );
};

export default FicheTerritoriale;
