import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { FormulaireConsolidation } from "@/components/PageConsolidation/FormulaireConsolidation";

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
  return (
    <div className="mx-auto w-full max-w-[1200px] py-6">
      <pageConsolidation.ServerSidePropsProvider value={props}>
        <FormulaireConsolidation />
      </pageConsolidation.ServerSidePropsProvider>
    </div>
  );
}
