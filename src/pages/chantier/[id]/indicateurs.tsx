import { GetServerSidePropsResult } from "next";
import { GetServerSidePropsContext } from "next/types";
import Head from "next/head";
import { FunctionComponent } from "react";
import { useSession } from "next-auth/react";
import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";
import PageImportIndicateur from "@/components/PageImportIndicateur/PageImportIndicateur";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { ChantierInformations } from "@/components/PageImportIndicateur/ChantierInformation.interface";
import { dependencies } from "@/server/infrastructure/Dependencies";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import {
  presenterEnRapportContrat,
  RapportContrat,
} from "@/server/app/contrats/RapportContrat";
import { estAutoriséAImporterDesIndicateurs } from "@/client/utils/indicateur/indicateur";
import {
  InformationIndicateurContrat,
  presenterEnInformationIndicateurContrat,
} from "@/server/app/contrats/InformationIndicateurContrat";
import { getFiltresActifs } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";

const loadSearchParams = createLoader({
  jalon: parseAsInteger,
  rapportId: parseAsString,
});

interface NextPageImportIndicateurProps {
  chantierInformations: ChantierInformations;
  indicateurs: Indicateur[];
  rapport: RapportContrat | null;
  informationsIndicateur: InformationIndicateurContrat[];
}

type GetServerSideProps =
  GetServerSidePropsResult<NextPageImportIndicateurProps>;
type Params = {
  id: Chantier["id"];
  indicateurId: string;
  rapportId: string;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<Params>,
): Promise<GetServerSideProps> {
  const { query, params } = context;
  if (!params?.id) {
    return {
      notFound: true,
    };
  }
  const searchParams = loadSearchParams(query);
  const jalon =
    searchParams.jalon ??
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );

  const session = await auth(context);
  if (!session || !estAutoriséAImporterDesIndicateurs(session.profil)) {
    throw new Error("Not connected or not authorized ?");
  }

  const chantier = await getContainer("chantiers")
    .resolve("recupererChantierUseCaseV2")
    .run(params.id, session.habilitations, session.profil, jalon);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(
    params.id,
  );

  let rapport: RapportContrat | null = null;

  if (searchParams.rapportId) {
    rapport = presenterEnRapportContrat(
      await dependencies
        .getRapportRepository()
        .récupérerRapportParId(searchParams.rapportId),
    );
  }

  const informationsIndicateur =
    await Promise.all<InformationIndicateurContrat>(
      indicateurs.map((indicateur) =>
        dependencies
          .getImportIndicateurRepository()
          .recupererInformationIndicateurParId(indicateur.id)
          .then((result) => presenterEnInformationIndicateurContrat(result)),
      ),
    );

  return {
    props: {
      indicateurs,
      informationsIndicateur,
      rapport,
      chantierInformations: {
        id: chantier.id,
        nom: chantier.nom,
      },
    },
  };
}

const NextPageImportIndicateur: FunctionComponent<
  NextPageImportIndicateurProps
> = ({
  chantierInformations,
  indicateurs,
  informationsIndicateur,
  rapport,
}) => {
  const { data: session } = useSession();
  const filtresActifs = getFiltresActifs();

  const territoireCode = Boolean(filtresActifs?.territoireCode)
    ? filtresActifs.territoireCode
    : session!.habilitations.lecture.territoires.includes("NAT-FR")
      ? "NAT-FR"
      : session!.habilitations.lecture.territoires[0];

  const hrefBoutonRetour = `/chantier/${chantierInformations.id}/${territoireCode}`;

  return (
    <>
      <Head>
        <title>
          {`Mettre à jour les données - Chantier ${chantierInformations.id.replace("CH-", "")} - PILOTE`}
        </title>
      </Head>
      <PageImportIndicateur
        chantierInformations={chantierInformations}
        hrefBoutonRetour={hrefBoutonRetour}
        indicateurs={indicateurs}
        informationsIndicateur={informationsIndicateur}
        rapport={rapport}
      />
    </>
  );
};

export default NextPageImportIndicateur;
