import { InferGetServerSidePropsType } from "next";
import { getContainer } from "@/server/dependances";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";

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
      <div>
        <h1>PagePilotage</h1>

        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </pagePilotage.ServerSidePropsProvider>
  );
}
