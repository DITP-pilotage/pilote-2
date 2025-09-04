import { FunctionComponent } from "react";
import { convertitEnPondération } from "@/client/utils/ponderation/ponderation";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

interface IndicateurPondérationProps {
  indicateurPondération: number | null;
}

const adjectifÀPartirDeLaMaille: Record<MailleTerritoireSelectionne, string> = {
  NAT: "national",
  DEPT: "départemental",
  REG: "régional",
};

const IndicateurPonderation: FunctionComponent<IndicateurPondérationProps> = ({
  indicateurPondération,
}) => {
  const { territoireCode } = useBlocIndicateurContext();

  const { maille: mailleDuTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  return (
    <p className="fr-text--xs texte-gris fr-mb-0">
      {indicateurPondération === null ? (
        `La pondération n'est pas disponible pour le taux d'avancement ${adjectifÀPartirDeLaMaille[mailleDuTerritoireSelectionnee]}.`
      ) : indicateurPondération === 0 ? (
        `Cet indicateur n'est pas pris en compte dans le taux d'avancement ${adjectifÀPartirDeLaMaille[mailleDuTerritoireSelectionnee]} du chantier.`
      ) : (
        <>
          Cet indicateur représente{" "}
          <span className="fr-text--bold">
            {convertitEnPondération(indicateurPondération)}%
          </span>{" "}
          du taux d'avancement{" "}
          {adjectifÀPartirDeLaMaille[mailleDuTerritoireSelectionnee]} du
          chantier.
        </>
      )}
    </p>
  );
};

export default IndicateurPonderation;
