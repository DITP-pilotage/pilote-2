import { InferGetServerSidePropsType } from "next";
import { getContainer } from "@/server/dependances";

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
    <div>
      <h1>PagePilotage</h1>

      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
