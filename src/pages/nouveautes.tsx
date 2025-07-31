import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import { getServerSession } from "next-auth/next";
import Nouveautés from "@/components/Nouveautés/Nouveautés";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";

export const getServerSideProps: GetServerSideProps<{
  estAutoriseAModifierLesNouveautés: boolean;
}> = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  const estAutoriseAModifierLesNouveautés =
    session?.profil === ProfilEnum.DITP_ADMIN;

  const listeNouveautes = await getContainer("parametrageNouveautes")
    .resolve("listerNouveautesUseCase")
    .execute();

  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  res.setHeader(
    "Set-Cookie",
    `derniereVersionNouveauteConsulte=${listeNouveautes?.[0]?.version || "1.0.0"}; path=/; samesite=lax; expires="${date.toUTCString()}";`,
  );

  return {
    props: {
      estAutoriseAModifierLesNouveautés,
    },
  };
};

const NextPageNouveautés: FunctionComponent<{
  estAutoriseAModifierLesNouveautés: boolean;
}> = ({ estAutoriseAModifierLesNouveautés }) => {
  return (
    <>
      <Head>
        <title>Nouveautés</title>
      </Head>
      <Nouveautés
        estAutoriseAModifierLesNouveautés={estAutoriseAModifierLesNouveautés}
      />
    </>
  );
};

export default NextPageNouveautés;
