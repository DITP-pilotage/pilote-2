import { useState } from "react";
import { pageParametrageSourceContext } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/PageParametrageSourceContext";
import { clsxm } from "@/utils/clsxm";
import { MetadataIndicateurForm } from "./types";
import { MetadataFieldEditor } from "./MetadataFieldEditor";

export const FormulaireParametrageSourceIndicateur = () => {
  const { listeMetadonneesIndicateur } =
    pageParametrageSourceContext.useServerSidePropsContext();

  const [metadataList, setMetadataList] = useState<MetadataIndicateurForm[]>(
    listeMetadonneesIndicateur,
  );
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

  /* const supprimerChamp = (index: number) => {
    setMetadataList(metadataList.filter((_, i) => i !== index));
    if (selectedIndex === index) {
      setSelectedIndex(null);
    }
  };
  */

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
    <div className="flex flex-column">
      <div className="flex justify-between align-center !mb-2">
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

      <div className="flex gap-2">
        <div className="bg-white p-3 border rounded">
          <input
            className="fr-input fr-mb-2w"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un champ..."
            type="text"
            value={searchTerm}
          />

          <div className="flex flex-column gap-2">
            {metadataFiltrees.map((metadata) => {
              const originalIndex = metadataList.indexOf(metadata);
              return (
                <div className="border rounded" key={originalIndex}>
                  <button
                    className={clsxm(`flex w-full p-2 text-left`, {
                      "!bg-blue-100 !border-blue-500":
                        selectedIndex === originalIndex,
                      "!hover:bg-gray-100": selectedIndex !== originalIndex,
                    })}
                    onClick={() => setSelectedIndex(originalIndex)}
                    type="button"
                  >
                    <span className="w-[20ch] truncate bold">
                      {metadata.name || "(Sans nom)"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {selectedIndex !== null && metadataList[selectedIndex] ? (
          <MetadataFieldEditor
            metadata={metadataList[selectedIndex]}
            onChange={(metadata) => modifierChamp(selectedIndex, metadata)}
          />
        ) : (
          <div className="bg-white p-4 border rounded text-center text-gray-500">
            Sélectionnez un champ pour l'éditer ou créez-en un nouveau
          </div>
        )}
      </div>
    </div>
  );
};
