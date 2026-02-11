import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/chantier/[id]/[territoireCode]";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";

export const pageChantier =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();

export function useTerritoireSelectionne() {
  const { territoireCode } = pageChantier.useServerSidePropsContext();
  return récupérerDétailsSurUnTerritoire(territoireCode);
}
