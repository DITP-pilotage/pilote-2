import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { TableauValeursIndicateur } from "./TableauValeursIndicateur";

const IndicateurBlocIndicateurTuile = () => {
  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();

  return (
    <TableauValeursIndicateur
      données={detailIndicateurDuTerritoire}
      territoireNom={detailTerritoireSelectionne.nom}
    />
  );
};

export default IndicateurBlocIndicateurTuile;
