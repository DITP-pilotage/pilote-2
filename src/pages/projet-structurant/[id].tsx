import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { FunctionComponent } from 'react';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';
import RécupérerProjetStructurantUseCase from '@/server/usecase/projetStructurant/RécupérerProjetStructurantUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';

interface NextPageProjetStructurantProps {
  projetStructurant: ProjetStructurant,
  indicateurs: Indicateur[],
  détailsIndicateurs: DétailsIndicateurs
  jalon: number
}

export async function getServerSideProps({ req, res, params, query }: GetServerSidePropsContext<{
  id: ProjetStructurant['id']
}>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const jalon = Number.parseInt(query.jalon as string) || getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente);

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  const projetStructurant: ProjetStructurant = await new RécupérerProjetStructurantUseCase(
    dependencies.getProjetStructurantRepository(),
    dependencies.getTerritoireRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ).run(params.id, session.habilitations);
  const indicateurRepository = dependencies.getIndicateurProjetStructurantRepository();
  const {
    indicateurs,
    détails,
  } = await indicateurRepository.récupérerParProjetStructurant(projetStructurant.id, projetStructurant.territoire.codeInsee);

  return {
    props: {
      projetStructurant,
      indicateurs,
      détailsIndicateurs: détails,
      jalon,
    },
  };
}

const NextPageProjetStructurant: FunctionComponent<NextPageProjetStructurantProps> = ({
  projetStructurant,
  indicateurs,
  détailsIndicateurs,
  jalon,
}) => {
  return (
    <>
      <Head>
        <title>
          {`Projet structurant - ${projetStructurant.nom} - PILOTE`}
        </title>
      </Head>
      <PageProjetStructurant
        détailsIndicateurs={détailsIndicateurs}
        indicateurs={indicateurs}
        jalon={jalon}
        projetStructurant={projetStructurant}
      />
    </>
  );
};

export default NextPageProjetStructurant;
