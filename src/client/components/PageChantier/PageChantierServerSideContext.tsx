import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/chantier/[id]/[territoireCode]";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";

export const pageChantier =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();

export function useTerritoireSelectionne() {
  const { territoireCode } = pageChantier.useServerSidePropsContext();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  return récupérerDétailsSurUnTerritoire(territoireCode);
}
