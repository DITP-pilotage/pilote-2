import { type GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { configuration } from "@/config";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import PageIndicateursAMettreAJour from "@/client/components/PageIndicateursAMettreAJour/PageIndicateursAMettreAJour";

interface Props {
  jalon: number;
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const session = await auth(context);
  const redirectionAccueil = {
    redirect: { destination: "/", permanent: false },
  };

  if (!session) {
    return redirectionAccueil;
  }

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });

  if (
    !featureFlips["NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR"] ||
    !habilitation.estAutoriseAAccederAuxIndicateursNonAJour()
  ) {
    return redirectionAccueil;
  }

  return {
    props: {
      jalon: getAnneeDateDeBascule(
        new Date(),
        configuration().dateBasculeAffichageValeursAnneePrecedente,
      ),
    },
  };
};

export default function IndicateursAMettreAJourPage({ jalon }: Props) {
  return <PageIndicateursAMettreAJour jalon={jalon} />;
}
