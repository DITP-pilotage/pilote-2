import Bloc from "@/components/_commons/Bloc/Bloc";
import Publication from "@/components/_commons/PublicationChantier/Publication";
import { libellésTypesDécisionStratégique } from "@/client/constants/libellésDécisionStratégique";
import { pageChantier } from "@/client/components/PageChantier/PageChantierServerSideContext";
import DécisionsStratégiquesProps from "./DécisionsStratégiques.interface";

export default function DécisionsStratégiques({
  décisionStratégique,
  chantierId,
  modeÉcriture = false,
  estInteractif = true,
  territoireCode,
}: DécisionsStratégiquesProps) {
  const { chantier } = pageChantier.useServerSidePropsContext();

  return (
    <Bloc
      backgroundClassNameTitre={
        chantier.statut === "ARCHIVE" ? "bg-dsfr-grey-925" : undefined
      }
      titre="France"
    >
      <Publication
        caractéristiques={{
          type: "suiviDesDécisionsStratégiques",
          libelléType:
            libellésTypesDécisionStratégique.suiviDesDécisionsStratégiques,
          entité: "décisions stratégiques",
          consigneDÉcriture:
            "Notez les décisions prises lors des réunions Elysée <> Matignon et indiquez les actions envisagées et/ou réalisées pour mettre en œuvre ou répondre à ces décisions.",
        }}
        estInteractif={estInteractif}
        maille="nationale"
        modeÉcriture={modeÉcriture}
        publicationInitiale={décisionStratégique}
        réformeId={chantierId}
        territoireCode={territoireCode}
      />
    </Bloc>
  );
}
