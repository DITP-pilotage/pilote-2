import { Button } from "@/components/shared/Button";
import {
  FormTextField,
  FormTextareaField,
} from "@/components/shared/FormTextField";
import { api } from "@/server/framework/trpc/api";
import { useFormParametrageSource } from "./form";
import { SelectMetadata } from "./SelectMetadata";
import { CheckboxMetadata } from "./CheckboxMetadata";
import { AcceptedValuesEditor } from "./AcceptedValuesEditor";
import { ZonegroupValuesPreview } from "./ZonegroupValuesPreview";

const NOM_CHAMP_ZONE_GROUPE = "zg_applicable";

export const MetadataFieldEditor = ({ fieldIndex }: { fieldIndex: number }) => {
  const form = useFormParametrageSource();
  const name = form.watch(`metadataList.${fieldIndex}.name`);
  const editBoxType = form.watch(`metadataList.${fieldIndex}.editBoxType`);
  const listeValeursAcceptes = form.watch(
    `metadataList.${fieldIndex}.listeValeursAcceptes`,
  );
  const estChampZoneGroupe = name === NOM_CHAMP_ZONE_GROUPE;
  const { data: zonegroupsActifs = [] } = api.metadataZonegroup.list.useQuery(
    { actifsSeulement: true },
    { enabled: estChampZoneGroupe },
  );
  const optionsValeurParDefaut = estChampZoneGroupe
    ? zonegroupsActifs.map((zonegroup) => ({
        valeur: zonegroup.zoneGroupId,
        nom: zonegroup.zgName,
      }))
    : listeValeursAcceptes;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-full">
      <div className="flex flex-column p-6 gap-8">
        <div>
          <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 flex items-center !mb-2">
            Informations de base
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormTextField
              className="text-sm font-normal min-h-[38px]"
              control={form.control}
              label="Nom du champ ⚠️"
              name={`metadataList.${fieldIndex}.name`}
              placeholder="Ex: indic_id"
              required
            />

            <FormTextField
              className="text-sm font-normal min-h-[38px]"
              control={form.control}
              label="Alias (affichage)"
              name={`metadataList.${fieldIndex}.alias`}
              placeholder="Ex: Identifiant"
              required
            />
          </div>
          <FormTextareaField
            className="text-sm font-normal min-h-[38px]"
            control={form.control}
            label="Description"
            name={`metadataList.${fieldIndex}.description`}
            placeholder="Description du champ..."
          />
        </div>

        {/* Section Type et affichage */}
        <div>
          <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-4 flex items-center gap-2 !mb-2">
            Type et affichage
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectMetadata
                label="Type de données"
                name={`metadataList.${fieldIndex}.dataType`}
                options={[
                  { valeur: "text", libelle: "Texte" },
                  { valeur: "boolean", libelle: "Booléen" },
                  { valeur: "number", libelle: "Nombre" },
                ]}
                required
              />

              <SelectMetadata
                label="Type de champ de saisie"
                name={`metadataList.${fieldIndex}.editBoxType`}
                options={[
                  { valeur: "", libelle: "Aucun" },
                  { valeur: "text", libelle: "Texte" },
                  { valeur: "textarea", libelle: "Zone de texte" },
                  { valeur: "boolean", libelle: "Booléen" },
                  { valeur: "multi-select", libelle: "Multi-select" },
                ]}
              />
            </div>

            {/* Valeurs acceptées si multi-select */}
            {editBoxType === "multi-select" && (
              <div className="pt-4">
                <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-4 flex items-center gap-2 !mb-2">
                  Valeurs acceptées
                </h3>
                {estChampZoneGroupe ? (
                  <ZonegroupValuesPreview zonegroupsActifs={zonegroupsActifs} />
                ) : (
                  <AcceptedValuesEditor fieldIndex={fieldIndex} />
                )}
              </div>
            )}

            {editBoxType === "multi-select" && (
              <SelectMetadata
                label="Valeur par défaut"
                name={`metadataList.${fieldIndex}.defaultValue`}
                options={[
                  { valeur: "", libelle: "Aucune valeur par défaut" },
                  ...(optionsValeurParDefaut ?? []).map((valeur) => ({
                    valeur: valeur.valeur,
                    libelle: valeur.nom || valeur.valeur,
                  })),
                ]}
              />
            )}

            {editBoxType === "boolean" && (
              <CheckboxMetadata
                label="Coché par défaut"
                name={`metadataList.${fieldIndex}.defaultValue`}
              />
            )}

            {editBoxType !== "multi-select" && editBoxType !== "boolean" && (
              <FormTextField
                className="text-sm font-normal min-h-[38px]"
                control={form.control}
                label="Valeur par défaut"
                name={`metadataList.${fieldIndex}.defaultValue`}
                placeholder="Valeur par défaut..."
              />
            )}
          </div>
        </div>

        {/* Section Validation */}
        <div>
          <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-0 flex items-center gap-2 !mb-2">
            Validation
          </h3>
          <div className="flex mb-4">
            <Button asChild className="text-xs" variant="link">
              <a href="https://regex101.com/">Tester sa RegEx</a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormTextField
              className="text-sm font-normal min-h-[38px]"
              control={form.control}
              label="RegEx de validation"
              name={`metadataList.${fieldIndex}.validationRegex`}
              placeholder="Ex: ^IND-\d{3,4}$"
            />

            <FormTextField
              className="text-sm font-normal min-h-[38px]"
              control={form.control}
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
