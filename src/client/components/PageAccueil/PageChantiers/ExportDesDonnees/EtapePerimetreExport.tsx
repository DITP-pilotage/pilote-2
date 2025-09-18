import React from "react";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";

export const EtapePerimetreExport = () => {
  const [isAvecFiltre, setIsAvecFiltre] = useQueryState(
    "isAvecFiltre",
    parseAsBoolean.withDefault(false).withOptions({
      shallow: true,
    }),
  );

  const [, setEtapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
    }),
  );

  return (
    <div>
      <p className="fr-mb-1w">Précisez le périmètre de votre export :</p>
      <div className="fr-fieldset__element" key="chantiers">
        <div className="fr-radio-group">
          <input
            checked={!isAvecFiltre}
            id="chantiers"
            name="ressource-à-exporter"
            onChange={() => setIsAvecFiltre(false)}
            type="radio"
          />
          <label className="fr-label" htmlFor="chantiers">
            exporter tous les éléments sur tous les territoires qui vous sont
            ouverts en lecture
          </label>
        </div>
      </div>
      <div className="fr-fieldset__element" key="indicateurs">
        <div className="fr-radio-group">
          <input
            checked={isAvecFiltre}
            id="indicateurs"
            name="ressource-à-exporter"
            onChange={() => setIsAvecFiltre(true)}
            type="radio"
          />
          <label className="fr-label" htmlFor="indicateurs">
            exporter les éléments de la sélection présentement active dans
            PILOTE
          </label>
          <label
            className="fr-label fr-text--xs !text-dsfr-mention-grey fr-pl-4w"
            htmlFor="indicateurs"
          >
            le cas échéant, le territoire sélectionné et tous les territoires
            inclus aux mailles inférieures seront intégrés dans l'export
          </label>
        </div>
      </div>
      <div className="w-full flex justify-end fr-mt-2w">
        <button
          aria-controls="modale-exporter-les-données-v2"
          className="fr-link fr-mr-2w"
          title="Fermer la fenêtre modale"
          type="button"
        >
          Annuler
        </button>
        <button
          className="fr-btn fr-btn--secondary fr-mr-2w"
          onClick={() => setEtapeCourante(1)}
          type="button"
        >
          Étape précédente
        </button>
        <button
          className="fr-btn fr-mr-2w"
          onClick={() => setEtapeCourante(3)}
          type="button"
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
