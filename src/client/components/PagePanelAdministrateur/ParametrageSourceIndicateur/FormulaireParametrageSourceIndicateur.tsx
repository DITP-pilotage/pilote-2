import { FunctionComponent, useState } from "react";
import { MetadataIndicateurForm } from "./types";
import { MetadataFieldEditor } from "./MetadataFieldEditor";
import { mockMetadataIndicateurs } from "./mockData";

interface FormulaireParametrageSourceIndicateurProps {
  initialData?: MetadataIndicateurForm[];
}

export const FormulaireParametrageSourceIndicateur: FunctionComponent<
  FormulaireParametrageSourceIndicateurProps
> = ({ initialData = mockMetadataIndicateurs }) => {
  const [metadataList, setMetadataList] =
    useState<MetadataIndicateurForm[]>(initialData);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const ajouterChamp = () => {
    const nouveauChamp: MetadataIndicateurForm = {
      name: "",
      dataType: "text",
      description: "",
      estVisible: true,
      alias: "",
      estEditable: true,
      validationRegex: "",
      validationRegexErrorMessage: null,
      editBoxType: "text",
      defaultValue: "",
      estObligatoire: false,
      doitAfficherLaDescription: false,
      listeValeursAcceptes: [],
    };
    setMetadataList([...metadataList, nouveauChamp]);
    setSelectedIndex(metadataList.length);
  };

  const supprimerChamp = (index: number) => {
    setMetadataList(metadataList.filter((_, i) => i !== index));
    if (selectedIndex === index) {
      setSelectedIndex(null);
    }
  };

  const modifierChamp = (index: number, metadata: MetadataIndicateurForm) => {
    const nouvelleListe = [...metadataList];
    nouvelleListe[index] = metadata;
    setMetadataList(nouvelleListe);
  };

  const sauvegarder = () => {
    // TODO: Implémenter la sauvegarde vers le backend
    alert("Sauvegarde des métadonnées (à implémenter)");
  };

  const metadataFiltrees = metadataList.filter(
    (meta) =>
      meta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meta.alias.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fr-container">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <div className="flex justify-between align-center fr-mb-3w">
            <h2 className="fr-h2 fr-mb-0">Configuration des métadonnées</h2>
            <div className="flex gap-2">
              <button
                className="fr-btn fr-btn--secondary"
                onClick={ajouterChamp}
                type="button"
              >
                Ajouter un champ
              </button>
              <button
                className="fr-btn fr-btn--primary"
                onClick={sauvegarder}
                type="button"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        <div className="fr-col-4">
          <div className="bg-white p-3 border rounded">
            <input
              className="fr-input fr-mb-2w"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un champ..."
              type="text"
              value={searchTerm}
            />

            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {metadataFiltrees.map((metadata) => {
                const originalIndex = metadataList.indexOf(metadata);
                return (
                  <div
                    className={`p-2 fr-mb-1w border rounded cursor-pointer ${
                      selectedIndex === originalIndex
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    key={originalIndex}
                    onClick={() => setSelectedIndex(originalIndex)}
                  >
                    <div className="flex justify-between align-center">
                      <div>
                        <div className="font-bold">
                          {metadata.name || "(Sans nom)"}
                        </div>
                        <div className="fr-text--sm text-gray-600">
                          {metadata.alias}
                        </div>
                      </div>
                      <button
                        className="fr-btn fr-btn--sm fr-btn--secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimerChamp(originalIndex);
                        }}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="fr-text--xs text-gray-500 fr-mt-1w">
                      Type: {metadata.editBoxType || "Aucun"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fr-col-8">
          {selectedIndex !== null && metadataList[selectedIndex] ? (
            <MetadataFieldEditor
              metadata={metadataList[selectedIndex]}
              onChange={(metadata) => modifierChamp(selectedIndex, metadata)}
              onClose={() => setSelectedIndex(null)}
            />
          ) : (
            <div className="bg-white p-4 border rounded text-center text-gray-500">
              Sélectionnez un champ pour l'éditer ou créez-en un nouveau
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
