import { FunctionComponent, ReactNode } from "react";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";
import { ContenuHtmlStyled } from "./EditeurContenu3Colonnes.styled";

export interface ItemListe {
  id: string;
  label: string;
  sousTitre: string;
}

interface EditeurContenu3ColonnesProps {
  items: ItemListe[];
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  onCreer: () => void;
  libelleBoutonCreer: string;
  estChargement: boolean;

  contenu: string;
  onContenuChange: (contenu: string) => void;
  champsSupplementaires?: ReactNode;
  onSauvegarder: () => void;

  contenuPreview: string;
}

export const EditeurContenu3Colonnes: FunctionComponent<
  EditeurContenu3ColonnesProps
> = ({
  items,
  itemSelectionneId,
  onSelectionItem,
  onCreer,
  libelleBoutonCreer,
  estChargement,
  contenu,
  onContenuChange,
  champsSupplementaires,
  onSauvegarder,
  contenuPreview,
}) => {
  if (estChargement) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white border-gray-200 rounded-lg">
      <div className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <button
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-90"
            onClick={onCreer}
            type="button"
          >
            {libelleBoutonCreer}
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {items.map((item) => (
            <div
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                item.id === itemSelectionneId
                  ? "bg-dsfr-blue-france-950 border-l-[3px] border-l-primary"
                  : ""
              }`}
              role="button"
              key={item.id}
              onClick={() => onSelectionItem(item.id)}
            >
              <div className="font-bold text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.sousTitre}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="p-4 border-b border-gray-200 flex items-end gap-4">
          <div className="flex-1">{champsSupplementaires}</div>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-90 shrink-0"
            onClick={onSauvegarder}
            type="button"
          >
            Sauvegarder
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EditeurRiche
            contenu={contenu}
            onChange={onContenuChange}
            placeholder="Saisissez votre contenu..."
          />
        </div>
      </div>

      <div className="flex-1 border-l border-gray-200 overflow-y-auto p-4">
        <h3 className="text-base font-bold mb-4">Aperçu</h3>
        <ContenuHtmlStyled
          dangerouslySetInnerHTML={{ __html: contenuPreview }}
        />
      </div>
    </div>
  );
};
