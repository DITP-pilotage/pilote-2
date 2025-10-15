import { FunctionComponent } from "react";
import { ValeurAccepte } from "./types";

interface AcceptedValuesEditorProps {
  values: ValeurAccepte[];
  onChange: (values: ValeurAccepte[]) => void;
}

export const AcceptedValuesEditor: FunctionComponent<
  AcceptedValuesEditorProps
> = ({ values, onChange }) => {
  const ajouterValeur = () => {
    const nouvelleValeur: ValeurAccepte = {
      ordre:
        values.length > 0 ? Math.max(...values.map((v) => v.ordre)) + 1 : 1,
      valeur: "",
      nom: "",
      description: "",
    };
    onChange([...values, nouvelleValeur]);
  };

  const supprimerValeur = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const modifierValeur = (
    index: number,
    field: keyof ValeurAccepte,
    value: string | number,
  ) => {
    const nouvelleListe = [...values];
    nouvelleListe[index] = { ...nouvelleListe[index], [field]: value };
    onChange(nouvelleListe);
  };

  return (
    <div className="fr-mt-2w">
      <span className="fr-label font-bold">Valeurs acceptées</span>
      {values.map((acceptedValue, index) => (
        <div className="border p-3 fr-mb-2w rounded" key={index}>
          <div className="flex justify-between align-center fr-mb-1w">
            <span className="font-bold">Valeur {index + 1}</span>
            <button
              className="fr-btn fr-btn--sm fr-btn--secondary"
              onClick={() => supprimerValeur(index)}
              type="button"
            >
              Supprimer
            </button>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`order-${index}`}>
                Ordre
              </label>
              <input
                className="fr-input bg-white"
                id={`order-${index}`}
                onChange={(e) =>
                  modifierValeur(
                    index,
                    "ordre",
                    Number.parseInt(e.target.value) || 0,
                  )
                }
                type="number"
                value={acceptedValue.ordre}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`value-${index}`}>
                Valeur
              </label>
              <input
                className="fr-input"
                id={`value-${index}`}
                onChange={(e) =>
                  modifierValeur(index, "valeur", e.target.value)
                }
                type="text"
                value={acceptedValue.valeur}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`name-${index}`}>
                Nom
              </label>
              <input
                className="fr-input"
                id={`name-${index}`}
                onChange={(e) => modifierValeur(index, "nom", e.target.value)}
                type="text"
                value={acceptedValue.nom}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`desc-${index}`}>
                Description
              </label>
              <input
                className="fr-input"
                id={`desc-${index}`}
                onChange={(e) =>
                  modifierValeur(index, "description", e.target.value)
                }
                type="text"
                value={acceptedValue.description}
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
