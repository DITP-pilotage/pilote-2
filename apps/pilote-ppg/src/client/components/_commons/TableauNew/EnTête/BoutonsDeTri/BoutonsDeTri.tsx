import FlècheDeTri from "@/components/_commons/Tableau/EnTête/FlècheDeTri/FlècheDeTri";
import { clsxm } from "@/utils/clsxm";

type DirectionDeTri = "asc" | "desc" | false;

interface BoutonsDeTriProps {
  nomColonneÀTrier: string;
  directionDeTri: DirectionDeTri;
  changementDirectionDeTriCallback: (tri: DirectionDeTri) => void;
}

export default function BoutonsDeTri({
  nomColonneÀTrier,
  directionDeTri,
  changementDirectionDeTriCallback,
}: BoutonsDeTriProps) {
  return (
    <div className="inline-block">
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre croissant`}
        className={clsxm(
          "w-6 bg-dsfr-blue-france-925 border border-white rounded hover:bg-dsfr-blue-france-925-hover fr-mr-1v",
          directionDeTri === "asc" &&
            "bg-primary hover:bg-dsfr-blue-france-sun-113-hover",
        )}
        onClick={() =>
          directionDeTri === "asc"
            ? changementDirectionDeTriCallback(false)
            : changementDirectionDeTriCallback("asc")
        }
        type="button"
      >
        <FlècheDeTri direction="asc" estActif={directionDeTri === "asc"} />
      </button>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre décroissant`}
        className={clsxm(
          "w-6 bg-dsfr-blue-france-925 border border-white rounded hover:bg-dsfr-blue-france-925-hover",
          directionDeTri === "desc" &&
            "bg-primary hover:bg-dsfr-blue-france-sun-113-hover",
        )}
        onClick={() =>
          directionDeTri === "desc"
            ? changementDirectionDeTriCallback(false)
            : changementDirectionDeTriCallback("desc")
        }
        type="button"
      >
        <FlècheDeTri direction="desc" estActif={directionDeTri === "desc"} />
      </button>
    </div>
  );
}
