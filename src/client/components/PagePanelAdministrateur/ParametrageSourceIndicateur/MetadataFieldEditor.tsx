import { FunctionComponent } from "react";
import { MetadataIndicateurForm } from "./types";
import { AcceptedValuesEditor } from "./AcceptedValuesEditor";

interface MetadataFieldEditorProps {
  metadata: MetadataIndicateurForm;
  onChange: (metadata: MetadataIndicateurForm) => void;
  onClose: () => void;
}

export const MetadataFieldEditor: FunctionComponent<
  MetadataFieldEditorProps
> = ({ metadata, onChange }) => {
  const handleChange = (
    field: keyof MetadataIndicateurForm,
    value: unknown,
  ) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 max-h-[75vh] overflow-y-auto">
        {/* Section Informations de base */}
        <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Informations de base
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="name"
            >
              Nom du champ <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all !bg-white"
              id="name"
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: indic_id"
              type="text"
              value={metadata.name}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="alias"
            >
              Alias (affichage) <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all !bg-white"
              id="alias"
              onChange={(e) => handleChange("alias", e.target.value)}
              placeholder="Ex: Identifiant"
              type="text"
              value={metadata.alias}
            />
          </div>

          <div className="col-span-2">
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none !bg-white"
              id="description"
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Description du champ..."
              rows={3}
              value={metadata.description}
            />
          </div>
        </div>

        {/* Section Type et affichage */}
        <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          Type et affichage
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="dataType"
              >
                Type de données <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all !bg-white"
                id="dataType"
                onChange={(e) =>
                  handleChange(
                    "dataType",
                    e.target.value as "text" | "boolean" | "number",
                  )
                }
                value={metadata.dataType}
              >
                <option value="text">📝 Texte</option>
                <option value="boolean">✓ Booléen</option>
                <option value="number">🔢 Nombre</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="boxType"
              >
                Type de champ de saisie
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all !bg-white"
                id="boxType"
                onChange={(e) =>
                  handleChange("editBoxType", e.target.value || null)
                }
                value={metadata.editBoxType || ""}
              >
                <option value="">Aucun</option>
                <option value="text">📄 Texte</option>
                <option value="textarea">📋 Zone de texte</option>
                <option value="boolean">☑️ Booléen</option>
                <option value="multi-select">📑 Multi-select</option>
              </select>
            </div>
          </div>

          {/* Valeurs acceptées si multi-select */}
          {metadata.editBoxType === "multi-select" && (
            <div className="pt-4 border-t border-green-300">
              <h5 className="text-md font-bold text-green-800 mb-3 flex items-center gap-2">
                <span className="text-xl">📑</span>
                Valeurs acceptées
              </h5>
              <AcceptedValuesEditor
                onChange={(values) =>
                  handleChange("listeValeursAcceptes", values)
                }
                values={metadata.listeValeursAcceptes}
              />
            </div>
          )}

          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="defaultValue"
            >
              Valeur par défaut
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all !bg-white"
              id="defaultValue"
              onChange={(e) => handleChange("defaultValue", e.target.value)}
              placeholder="Valeur par défaut..."
              type="text"
              value={metadata.defaultValue?.toString() || ""}
            />
          </div>
        </div>

        {/* Section Validation */}
        <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          Validation
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="regex"
            >
              Regex de validation
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm"
              id="regex"
              onChange={(e) => handleChange("validationRegex", e.target.value)}
              placeholder="Ex: ^IND-\d{3,4}$"
              type="text"
              value={metadata.validationRegex}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="regexViolation"
            >
              Message d'erreur regex
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all !bg-white"
              id="regexViolation"
              onChange={(e) =>
                handleChange("validationRegexErrorMessage", e.target.value)
              }
              placeholder="Message si validation échoue..."
              type="text"
              value={metadata.validationRegexErrorMessage || ""}
            />
          </div>
        </div>

        {/* Section Options */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Options
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-200 transition-all">
              <input
                checked={metadata.estVisible}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                onChange={(e) => handleChange("estVisible", e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold text-gray-700">
                👁️ Afficher
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-200 transition-all">
              <input
                checked={metadata.estEditable}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                onChange={(e) => handleChange("estEditable", e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold text-gray-700">
                ✏️ Éditable
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-200 transition-all">
              <input
                checked={metadata.estObligatoire}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                onChange={(e) =>
                  handleChange("estObligatoire", e.target.checked)
                }
                type="checkbox"
              />
              <span className="text-sm font-semibold text-gray-700">
                ⚠️ Obligatoire
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-200 transition-all">
              <input
                checked={metadata.doitAfficherLaDescription}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                onChange={(e) =>
                  handleChange("doitAfficherLaDescription", e.target.checked)
                }
                type="checkbox"
              />
              <span className="text-sm font-semibold text-gray-700">
                📖 Afficher la description
              </span>
            </label>
          </div>
        </div>

        {/* Section Valeurs acceptées (si multi-select) */}
        {metadata.editBoxType === "multi-select" && (
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
            <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📑</span>
              Valeurs acceptées
            </h4>
            <AcceptedValuesEditor
              onChange={(values) =>
                handleChange("listeValeursAcceptes", values)
              }
              values={metadata.listeValeursAcceptes}
            />
          </div>
        )}
      </div>
    </div>
  );
};
