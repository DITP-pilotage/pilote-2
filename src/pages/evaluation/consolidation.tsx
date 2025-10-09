import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const rattachements = await getContainer("piloteEval")
    .resolve("afficherConsolidationQuery")
    .run({ utilisateurId: session.user.id });

  return { props: { rattachements } };
};

export default function PageConsolidation(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return <pre>{JSON.stringify(props.rattachements, null, 2)}</pre>;
}
