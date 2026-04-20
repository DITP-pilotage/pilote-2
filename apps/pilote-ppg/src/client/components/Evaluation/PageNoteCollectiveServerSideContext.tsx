import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/evaluation/note-collective/[rattachementCode]";

export const pageNoteCollective =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();
