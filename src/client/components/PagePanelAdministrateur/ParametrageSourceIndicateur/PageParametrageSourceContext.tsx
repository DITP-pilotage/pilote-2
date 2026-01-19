import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/panel-administrateur/parametrage-metadata-indicateur";

export const pageParametrageSourceContext =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();
