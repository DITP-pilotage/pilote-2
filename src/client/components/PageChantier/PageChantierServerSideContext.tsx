import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/chantier/[id]/[territoireCode]";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";

export const pageChantier =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();

export function useTerritoireSelectionne() {
  const { territoireCode } = pageChantier.useServerSidePropsContext();
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  return récupérerDétailsSurUnTerritoire(territoireCode);
}
