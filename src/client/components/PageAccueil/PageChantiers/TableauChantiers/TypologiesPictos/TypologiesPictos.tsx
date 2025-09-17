import { FunctionComponent } from "react";
import { PictoBaromètre } from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import { PictoTerritorialise } from "@/components/_commons/PictoTerritorialisé/PictoTerritorialise";
import { PictoChantierBrouillon } from "@/components/_commons/PictoChantierBrouillon/PictoChantierBrouillon";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";

interface TypologiesPictosProps {
  typologies: DonnéesTableauChantiers["typologie"];
}

const TypologiesPictos: FunctionComponent<TypologiesPictosProps> = ({
  typologies,
}) => {
  if (
    !typologies.estBaromètre &&
    !typologies.estTerritorialisé &&
    !typologies.estBrouillon
  ) {
    return null;
  }

  return (
    <div className="flex">
      {typologies.estBaromètre ? <PictoBaromètre /> : null}
      {typologies.estTerritorialisé ? <PictoTerritorialise /> : null}
      {typologies.estBrouillon ? <PictoChantierBrouillon /> : null}
    </div>
  );
};

export default TypologiesPictos;
