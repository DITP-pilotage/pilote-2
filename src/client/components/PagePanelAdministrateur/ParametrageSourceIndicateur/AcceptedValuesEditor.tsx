import { Controller, useFieldArray } from "react-hook-form";
import { useFormParametrageSource } from "./form";
import { ValeurAccepte } from "./types";

export const AcceptedValuesEditor = ({
  fieldIndex,
}: {
  fieldIndex: number;
}) => {
  const form = useFormParametrageSource();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `metadataList.${fieldIndex}.listeValeursAcceptes`,
  });

  const ajouterValeur = () => {
    const valeurs = form.getValues(
      `metadataList.${fieldIndex}.listeValeursAcceptes`,
    );
    const nouvelleValeur: ValeurAccepte = {
      ordre:
        valeurs.length > 0 ? Math.max(...valeurs.map((v) => v.ordre)) + 1 : 1,
      valeur: "",
      nom: "",
      description: "",
    };
    append(nouvelleValeur);
  };

  return (
    <div className="fr-mt-2w">
      <span className="fr-label font-bold">Valeurs acceptées</span>
      {fields.map((item, index) => (
        <div className="border p-3 fr-mb-2w rounded" key={item.id}>
          <div className="flex justify-between align-center fr-mb-1w">
            <span className="font-bold">Valeur {index + 1}</span>
            <button
              className="fr-btn fr-btn--sm fr-btn--secondary"
              onClick={() => remove(index)}
              type="button"
            >
              Supprimer
            </button>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-3">
              <label
                className="fr-label"
                htmlFor={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.ordre`}
              >
                Ordre
              </label>
              <Controller
                control={form.control}
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.ordre`}
                render={({ field }) => (
                  <input
                    className="fr-input bg-white"
                    id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.ordre`}
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value) || 0)
                    }
                  />
                )}
              />
            </div>
            <div className="fr-col-3">
              <label
                className="fr-label"
                htmlFor={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.valeur`}
              >
                Valeur
              </label>
              <Controller
                control={form.control}
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.valeur`}
                render={({ field }) => (
                  <input
                    className="fr-input"
                    id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.valeur`}
                    type="text"
                    {...field}
                  />
                )}
              />
            </div>
            <div className="fr-col-3">
              <label
                className="fr-label"
                htmlFor={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.nom`}
              >
                Nom
              </label>
              <Controller
                control={form.control}
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.nom`}
                render={({ field }) => (
                  <input
                    className="fr-input"
                    id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.nom`}
                    type="text"
                    {...field}
                  />
                )}
              />
            </div>
            <div className="fr-col-3">
              <label
                className="fr-label"
                htmlFor={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.description`}
              >
                Description
              </label>
              <Controller
                control={form.control}
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.description`}
                render={({ field }) => (
                  <input
                    className="fr-input"
                    id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.description`}
                    type="text"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        className="fr-btn fr-btn--secondary"
        onClick={ajouterValeur}
        type="button"
      >
        Ajouter une valeur
      </button>
    </div>
  );
};
