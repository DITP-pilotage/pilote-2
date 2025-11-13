import { useFormParametrageSource } from "./form";
import { InputMetadata } from "./InputMetadata";
import { SelectMetadata } from "./SelectMetadata";
import { CheckboxMetadata } from "./CheckboxMetadata";
import { AcceptedValuesEditor } from "./AcceptedValuesEditor";

export const MetadataFieldEditor = ({ fieldIndex }: { fieldIndex: number }) => {
  const form = useFormParametrageSource();
  const editBoxType = form.watch(`metadataList.${fieldIndex}.editBoxType`);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-full">
      <div className="flex flex-column p-6 gap-8">
        {/* Section Informations de base */}
        <div>
          <h4 className="text-lg font-bold text-blue-900 flex items-center !mb-2">
            Informations de base
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <InputMetadata
              label="Nom du champ ⚠️"
              name={`metadataList.${fieldIndex}.name`}
              placeholder="Ex: indic_id"
              required
            />

            <InputMetadata
              label="Alias (affichage)"
              name={`metadataList.${fieldIndex}.alias`}
              placeholder="Ex: Identifiant"
              required
            />

            <InputMetadata
              className="col-span-2"
              label="Description"
              name={`metadataList.${fieldIndex}.description`}
              placeholder="Description du champ..."
              type="textarea"
            />
          </div>
        </div>

        {/* Section Type et affichage */}
        <div>
          <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2 !mb-2">
            Type et affichage
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectMetadata
                label="Type de données"
                name={`metadataList.${fieldIndex}.dataType`}
                required
              >
                <option value="text">Texte</option>
                <option value="boolean">Booléen</option>
                <option value="number">Nombre</option>
              </SelectMetadata>

              <SelectMetadata
                label="Type de champ de saisie"
                name={`metadataList.${fieldIndex}.editBoxType`}
              >
                <option value="">Aucun</option>
                <option value="text">Texte</option>
                <option value="textarea">Zone de texte</option>
                <option value="boolean">☑Booléen</option>
                <option value="multi-select">Multi-select</option>
              </SelectMetadata>
            </div>

            {/* Valeurs acceptées si multi-select */}
            {editBoxType === "multi-select" && (
              <div className="pt-4 border-t border-green-300">
                <h5 className="text-md font-bold text-green-800 mb-3 flex items-center gap-2">
                  Valeurs acceptées
                </h5>
                <AcceptedValuesEditor fieldIndex={fieldIndex} />
              </div>
            )}

            <InputMetadata
              label="Valeur par défaut"
              name={`metadataList.${fieldIndex}.defaultValue`}
              placeholder="Valeur par défaut..."
            />
          </div>
        </div>

        {/* Section Validation */}
        <div>
          <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2 !mb-2">
            Validation
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <InputMetadata
              label="Regex de validation"
              name={`metadataList.${fieldIndex}.validationRegex`}
              placeholder="Ex: ^IND-\d{3,4}$"
            />

            <InputMetadata
              label="Message d'erreur regex"
              name={`metadataList.${fieldIndex}.validationRegexErrorMessage`}
              placeholder="Message si validation échoue..."
            />
          </div>
        </div>

        {/* Section Options */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
            Options
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <CheckboxMetadata
              label="La metadata est-elle visible ?"
              name={`metadataList.${fieldIndex}.estVisible`}
            />

            <CheckboxMetadata
              label="La metadata est-elle editable ?"
              name={`metadataList.${fieldIndex}.estEditable`}
            />

            <CheckboxMetadata
              label="La metadata est-elle visible obligatoire ?"
              name={`metadataList.${fieldIndex}.estObligatoire`}
            />

            <CheckboxMetadata
              label="La description est elle visible ?"
              name={`metadataList.${fieldIndex}.doitAfficherLaDescription`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
