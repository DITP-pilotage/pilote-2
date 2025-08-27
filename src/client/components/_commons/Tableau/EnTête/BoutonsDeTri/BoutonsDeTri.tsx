import { FunctionComponent } from "react";
import clsx from "clsx";
import FlècheDeTri from "@/components/_commons/Tableau/EnTête/FlècheDeTri/FlècheDeTri";
import BoutonsDeTriStyled from "@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.styled";

export type DirectionDeTri = "asc" | "desc" | false;

interface BoutonsDeTriProps {
  nomColonneÀTrier: string;
  directionDeTri: DirectionDeTri;
  changementDirectionDeTriCallback: (tri: DirectionDeTri) => void;
}

const BoutonsDeTri: FunctionComponent<BoutonsDeTriProps> = ({
  nomColonneÀTrier,
  directionDeTri,
  changementDirectionDeTriCallback,
}) => {
  return (
    <BoutonsDeTriStyled>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre croissant`}
        className={clsx("bouton-de-tri fr-mr-1v h-7", {
          actif: directionDeTri === "asc",
        })}
        onClick={() =>
          directionDeTri === "asc"
            ? changementDirectionDeTriCallback(false)
            : changementDirectionDeTriCallback("asc")
        }
        title="Ascendant"
        type="button"
      >
        <FlècheDeTri direction="asc" estActif={directionDeTri === "asc"} />
      </button>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre décroissant`}
        className={clsx("bouton-de-tri h-7", {
          actif: directionDeTri === "desc",
        })}
        onClick={() =>
          directionDeTri === "desc"
            ? changementDirectionDeTriCallback(false)
            : changementDirectionDeTriCallback("desc")
        }
        title="Descendant"
        type="button"
      >
        <FlècheDeTri direction="desc" estActif={directionDeTri === "desc"} />
      </button>
    </BoutonsDeTriStyled>
  );
};

export default BoutonsDeTri;
