import type { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";
import PageAnnuaire from "@/client/components/PageAnnuaire/PageAnnuaire";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const featureFlips = await getContainer("gestionContenu")
    .resolve("recupererFeatureFlipsUseCase")
    .run();

  if (!featureFlips["NEXT_PUBLIC_FF_ANNUAIRE"]) {
    return { redirect: { destination: "/404", permanent: false } };
  }

  const session = await auth(context);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

export default function AnnuairePage() {
  return <PageAnnuaire />;
}
