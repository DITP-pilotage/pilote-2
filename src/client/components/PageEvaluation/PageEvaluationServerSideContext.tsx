import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/evaluation/auto-evaluation/[rattachementId]";

export const pageEvaluation =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();
