import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageParametrageSourceContext } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/PageParametrageSourceContext";
import { clsxm } from "@/utils/clsxm";
import { MetadataIndicateurForm } from "./types";
import { MetadataFieldEditor } from "./MetadataFieldEditor";
import { formSchema, FormValues } from "./form";
import { BoutonEnregistrerMetadataIndicateur } from "./BoutonEnregistrerMetadataIndicateur";

export const FormulaireParametrageSourceIndicateur = () => {
  const { listeMetadonneesIndicateur } =
    pageParametrageSourceContext.useServerSidePropsContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      metadataList: listeMetadonneesIndicateur,
    },
  });

  const { fields: metadataFields, append } = useFieldArray({
    control: form.control,
    name: "metadataList",
  });

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
      groupe: "METADATA_INDICATEURS",
      blocId: null,
    };
    append(nouveauChamp);
    setSelectedIndex(metadataFields.length);
  };

  const metadataValues = form.watch("metadataList");
  const metadataFiltrees = metadataFields.filter((_, index) => {
    const metadata = metadataValues[index];
    return (
      metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metadata.alias.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <FormProvider {...form}>
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
            <BoutonEnregistrerMetadataIndicateur />
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
              {metadataFiltrees.map((field) => {
                const originalIndex = metadataFields.findIndex(
                  (metadataField) => metadataField.id === field.id,
                );
                const metadata = metadataValues[originalIndex];
                return (
                  <div className="border rounded" key={field.id}>
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

          {selectedIndex !== null && metadataValues[selectedIndex] ? (
            <MetadataFieldEditor
              fieldIndex={selectedIndex}
              key={selectedIndex}
            />
          ) : (
            <div className="bg-white p-4 border rounded text-center text-gray-500">
              Sélectionnez un champ pour l'éditer ou créez-en un nouveau
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
};
