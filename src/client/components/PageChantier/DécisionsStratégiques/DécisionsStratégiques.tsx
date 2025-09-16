import Bloc from "@/components/_commons/Bloc/Bloc";
import Publication from "@/components/_commons/PublicationChantier/Publication";
import { libellésTypesDécisionStratégique } from "@/client/constants/libellésDécisionStratégique";

import Chantier from "@/server/domain/chantier/Chantier.interface";
import { RouterOutputs } from "@/server/infrastructure/api/trpc/trpc.interface";

export const DécisionsStratégiques = ({
  décisionStratégique,
  chantierId,
  modeÉcriture = false,
  estInteractif = true,
  estChantierArchive,
  territoireCode,
}: {
  décisionStratégique: RouterOutputs["publication"]["récupérerLaPlusRécente"];
  chantierId: Chantier["id"];
  territoireCode: string;
  modeÉcriture?: boolean;
  estInteractif?: boolean;
  estChantierArchive: boolean;
}) => {
  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
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
};
