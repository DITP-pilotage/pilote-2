import { InferGetServerSidePropsType } from "next";
import { getContainer } from "@/server/dependances";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { TableauPilotage } from "@/components/PagePilotage/TableauPilotage";

export const getServerSideProps = async () => {
  return {
    props: {
      pilotage: await getContainer("piloteEval")
        .resolve("afficherPilotageQuery")
        .run(),
    },
  };
};

export default function PagePilotage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pagePilotage.ServerSidePropsProvider value={props}>
      <div className="mx-auto w-full max-w-[1600px] py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Pilotage des évaluations</h1>

        <TableauPilotage />
      </div>
    </pagePilotage.ServerSidePropsProvider>
  );
}
