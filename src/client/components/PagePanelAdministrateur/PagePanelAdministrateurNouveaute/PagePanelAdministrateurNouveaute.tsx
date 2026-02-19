import { FunctionComponent } from "react";
import { EditeurContenu3Colonnes } from "@/components/_commons/EditeurContenu3Colonnes/EditeurContenu3Colonnes";
import { useEditionNouveaute } from "./useEditionNouveaute";

export const PagePanelAdministrateurNouveaute: FunctionComponent = () => {
  const {
    items,
    itemSelectionneId,
    selectionnerItem,
    creer,
    estChargement,
    contenu,
    setContenu,
    version,
    setVersion,
    date,
    setDate,
    sauvegarder,
  } = useEditionNouveaute();

  return (
    <EditeurContenu3Colonnes
      champsSupplementaires={
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setVersion(event.target.value)}
              type="text"
              value={version}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </div>
        </div>
      }
      contenu={contenu}
      contenuPreview={contenu}
      estChargement={estChargement}
      itemSelectionneId={itemSelectionneId}
      items={items}
      libelleBoutonCreer="Nouvelle nouveauté"
      onContenuChange={setContenu}
      onCreer={creer}
      onSauvegarder={sauvegarder}
      onSelectionItem={selectionnerItem}
    />
  );
};
