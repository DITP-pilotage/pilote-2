import { InferGetServerSidePropsType } from "next";
import { createServerSidePropsContext } from "@/hooks/createServerSidePropsContext";
import { getServerSideProps } from "@/pages/panel-administrateur/habilitations-coordinateur";

export const pageHabilitationsCoordinateur =
  createServerSidePropsContext<
    InferGetServerSidePropsType<typeof getServerSideProps>
  >();
