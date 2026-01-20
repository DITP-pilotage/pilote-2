import { Controller, useFieldArray } from "react-hook-form";
import { Input } from "@/components/_commons/Input";
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
      {fields.map((item, index) => (
        <div className="border fr-mb-2w rounded" key={item.id}>
          <div className="flex justify-between align-center fr-mb-1w border-b border-b-dsfr-blue-france-sun-113 p-3">
            <span className="font-bold">Valeur {index + 1}</span>
            <button
              className="fr-btn fr-btn--sm fr-btn--secondary"
              onClick={() => remove(index)}
              type="button"
            >
              Supprimer
            </button>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters p-3">
            <div className="fr-col-3">
              <Input
                className="text-sm font-normal min-h-[38px]"
                control={form.control}
                id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.ordre`}
                label="Ordre"
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.ordre`}
                placeholder="Ordre"
                required
              />
            </div>
            <div className="fr-col-3">
              <Input
                className="text-sm font-normal min-h-[38px]"
                control={form.control}
                id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.valeur`}
                label="Valeur"
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.valeur`}
                placeholder="Valeur"
                required
              />
            </div>
            <div className="fr-col-3">
              <Input
                className="text-sm font-normal min-h-[38px]"
                control={form.control}
                id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.nom`}
                label="Nom affiché"
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.nom`}
                placeholder="Nom affiché"
                required
              />
            </div>
            <div className="fr-col-3">
              <Input
                className="text-sm font-normal min-h-[38px]"
                control={form.control}
                id={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.description`}
                label="Description"
                name={`metadataList.${fieldIndex}.listeValeursAcceptes.${index}.description`}
                placeholder="Description"
                required
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
