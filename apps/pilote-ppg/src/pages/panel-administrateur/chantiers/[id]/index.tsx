import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { $Enums } from "@prisma/client";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { prisma } from "@/server/db/prisma";
import {
  MetadataChantierContrat,
  OptionsChantierContrat,
  presenterEnMetadataChantierContrat,
  presenterEnOptionsChantierContrat,
} from "@/server/app/contrats/MetadataChantierContrat";
import PageAdminChantierEdition from "@/components/PageAdminChantiers/PageAdminChantierEdition";

const redirigerVersAccueil = {
  redirect: { destination: "/", permanent: false },
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>,
) {
  const session = await auth(context);
  if (!session) return redirigerVersAccueil;

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin())
    return redirigerVersAccueil;

  const { params, query } = context;
  const estUneCréation = query._action === "creer-chantier";
  const modificationReussie = query._action === "modification-reussie";
  const creationReussie = query._action === "creation-reussie";

  const [ppgs, porteursMIN, porteursDac, perimetres, zonegroups] =
    await Promise.all([
      prisma.metadata_ppgs.findMany({ orderBy: { ppg_id: "asc" } }),
      prisma.metadata_porteurs.findMany({
        where: { porteur_type_short: "MIN" },
        orderBy: { porteur_id: "asc" },
      }),
      prisma.metadata_porteurs.findMany({
        where: { porteur_type_short: "DAC" },
        orderBy: { porteur_id: "asc" },
      }),
      prisma.metadata_perimetres.findMany({ orderBy: { perimetre_id: "asc" } }),
      prisma.metadata_zonegroup.findMany({ orderBy: { zone_group_id: "asc" } }),
    ]);

  const options: OptionsChantierContrat = presenterEnOptionsChantierContrat({
    ppgs,
    porteursMIN,
    porteursDac,
    perimetres,
    zonegroups,
  });

  let chantier: MetadataChantierContrat;

  if (estUneCréation) {
    const dernierChantier = await prisma.metadata_chantiers.findFirst({
      orderBy: { chantier_id: "desc" },
    });
    const dernierNumero = dernierChantier
      ? parseInt(dernierChantier.chantier_id.replace("CH-", ""), 10)
      : 0;
    const idSuivant = `CH-${String(dernierNumero + 1).padStart(3, "0")}`;

    chantier = {
      chantierId: idSuivant,
      chNom: "",
      chDescr: null,
      chPpg: "",
      chTerrito: false,
      chHiddenPilote: false,
      chSaisieAte: null,
      chState: $Enums.type_statut.BROUILLON,
      zgApplicable: null,
      porteurIdsNoDAC: [],
      porteurIdsDAC: [],
      chPer: "",
      mailleApplicable: ["NAT", "REG", "DEPT"],
      chCibleAttendue: false,
      conseillerMail: null,
    };
  } else {
    const chantierDb = await prisma.metadata_chantiers.findUnique({
      where: { chantier_id: params!.id },
    });
    if (!chantierDb) return redirigerVersAccueil;
    chantier = presenterEnMetadataChantierContrat(chantierDb);
  }

  return {
    props: {
      chantier,
      options,
      estUneCréation,
      modificationReussie,
      creationReussie,
    },
  };
}

const NextPageAdminChantierEdition: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({
  chantier,
  options,
  estUneCréation,
  modificationReussie,
  creationReussie,
}) => (
  <>
    <Head>
      <title>
        Panel Administrateur - Chantier {chantier.chantierId} - PILOTE
      </title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="metadata-chantier">
      <PageAdminChantierEdition
        chantier={chantier}
        creationReussie={creationReussie}
        estUneCréation={estUneCréation}
        modificationReussie={modificationReussie}
        options={options}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminChantierEdition;
