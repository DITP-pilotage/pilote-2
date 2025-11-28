import { FunctionComponent } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import assert from "node:assert";
import { PageFicheTerritoriale } from "@/components/PageFicheTerritoriale/PageFicheTerritoriale";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { ficheTerritorialeHandler } from "@/server/fiche-territoriale/infrastructure/handlers/FicheTerritorialeHandler";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration, configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
  query,
}: GetServerSidePropsContext) => {
  if (!configurationFeatureFlip().ficheTerritoriale) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const queryJalon = z.string().parse(query.jalon || "2025");
  const queryTerritoireCode = z.string().parse(query.territoireCode);

  const session = await getServerSession(req, res, authOptions);

  assert(session);

  if (!estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error("Not connected or not authorized ?");
  }

  if (queryTerritoireCode === "NAT-FR") {
    throw new Error("Veuillez choisir un département ou une région");
  }

  const jalon =
    Number.parseInt(queryJalon as string) ||
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
