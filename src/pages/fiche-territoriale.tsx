import { FunctionComponent } from "react";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { PageFicheTerritoriale } from "@/components/PageFicheTerritoriale/PageFicheTerritoriale";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { FicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat";
import { ficheTerritorialeHandler } from "@/server/fiche-territoriale/infrastructure/handlers/FicheTerritorialeHandler";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

export const getServerSideProps: GetServerSideProps<{
  ficheTerritoriale: FicheTerritorialeContrat;
  jalon: number;
}> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error("Not connected or not authorized ?");
  }

  if (query.territoireCode === "NAT-FR") {
    throw new Error("Veuillez choisir un département ou une région");
  }

  const jalon =
    Number.parseInt(query.jalon as string) ||
    getAnneeDateDeBascule(
      new Date(),
      configuration.dateBasculeAffichageValeursAnneePrecedente,
    );

  const ficheTerritoriale =
    await ficheTerritorialeHandler().recupererFicheTerritoriale(
      query.territoireCode as string,
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
