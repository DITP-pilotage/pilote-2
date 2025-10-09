import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/evaluation/consolidation";

export const pageConsolidation =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();
