import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";
import { presenterEnNewsletterContrat } from "@/server/actualites/app/contrats/NewsletterContrat";
import { PageNewsletterDetail } from "@/components/PageActualites/PageNewsletterDetail";

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ id: string }>,
) => {
  const session = await auth(context);

  if (!session || !session.user) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const idParam = Number(context.params?.id);

  if (isNaN(idParam)) {
    return { redirect: { destination: "/actualites", permanent: false } };
  }

  const newsletter = await getContainer("actualites")
    .resolve("recupererNewsletterUseCase")
    .execute({ id: idParam });

  return {
    props: { newsletter: presenterEnNewsletterContrat(newsletter) },
  };
};

export default function NextPageNewsletterDetail({
  newsletter,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>{newsletter.sujet} - PILOTE</title>
      </Head>
      <PageNewsletterDetail newsletter={newsletter} />
    </>
  );
}
