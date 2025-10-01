import { FunctionComponent } from "react";
import { AcceptedValueForm } from "./types";

interface AcceptedValuesEditorProps {
  values: AcceptedValueForm[];
  onChange: (values: AcceptedValueForm[]) => void;
}

export const AcceptedValuesEditor: FunctionComponent<
  AcceptedValuesEditorProps
> = ({ values, onChange }) => {
  const ajouterValeur = () => {
    const nouvelleValeur: AcceptedValueForm = {
      orderId:
        values.length > 0 ? Math.max(...values.map((v) => v.orderId)) + 1 : 1,
      value: "",
      name: "",
      desc: "",
    };
    onChange([...values, nouvelleValeur]);
  };

  const supprimerValeur = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const modifierValeur = (
    index: number,
    field: keyof AcceptedValueForm,
    value: string | number,
  ) => {
    const nouvelleListe = [...values];
    nouvelleListe[index] = { ...nouvelleListe[index], [field]: value };
    onChange(nouvelleListe);
  };

  return (
    <div className="fr-mt-2w">
      <label className="fr-label font-bold">Valeurs acceptées</label>
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
                    "orderId",
                    Number.parseInt(e.target.value) || 0,
                  )
                }
                type="number"
                value={acceptedValue.orderId}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`value-${index}`}>
                Valeur
              </label>
              <input
                className="fr-input"
                id={`value-${index}`}
                onChange={(e) => modifierValeur(index, "value", e.target.value)}
                type="text"
                value={acceptedValue.value}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`name-${index}`}>
                Nom
              </label>
              <input
                className="fr-input"
                id={`name-${index}`}
                onChange={(e) => modifierValeur(index, "name", e.target.value)}
                type="text"
                value={acceptedValue.name}
              />
            </div>
            <div className="fr-col-3">
              <label className="fr-label" htmlFor={`desc-${index}`}>
                Description
              </label>
              <input
                className="fr-input"
                id={`desc-${index}`}
                onChange={(e) => modifierValeur(index, "desc", e.target.value)}
                type="text"
                value={acceptedValue.desc}
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
