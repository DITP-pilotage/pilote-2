import React from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { Dialog } from "radix-ui";
import { MiseEnAvant } from "@/components/_commons/MiseEnAvant/MiseEnAvant";

export const EtapeContenuAExporter = () => {
  const [typeExport, setTypeExport] = useQueryState(
    "typeExport",
    parseAsStringLiteral(["chantiers", "indicateurs", "historique-indicateurs"])
      .withDefault("chantiers")
      .withOptions({
        shallow: true,
      }),
  );
  const [, setOptionsExport] = useQueryState(
    "optionsExport",
    parseAsString.withDefault("identifiant").withOptions({
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

  const modifierTypeExport = (
    typeExportADefinir: "chantiers" | "indicateurs" | "historique-indicateurs",
  ) => {
    if (
      typeExportADefinir === "chantiers" ||
      typeExportADefinir === "indicateurs"
    ) {
      setOptionsExport("identifiant");
    }
    if (typeExportADefinir === "historique-indicateurs") {
      setOptionsExport("identifiant,valeur-cible,valeur-avancement");
    }
    setTypeExport(typeExportADefinir);
  };

  return (
    <div>
      <p className="fr-mt-2w fr-mb-2w">
        Sélectionnez et exportez les données de votre choix, selon vos besoins
      </p>
      <MiseEnAvant titre="Pour mener à bien votre export de données, vous allez être amené à :">
        <ul>
          <li>
            indiquer les <span className="fr-text--bold">éléments</span> dont
            vous souhaitez récupérer les données : les chantiers, les
            indicateurs ou l'historique des indicateurs (étape 1) ;
          </li>
          <li>
            préciser le <span className="fr-text--bold">périmètre</span> de
            votre export : le cas échéant, filtrage des chantiers ou indicateurs
            et sélection des territoires (étape 2) ;
          </li>
          <li>
            enfin – s'il ne s'agit pas d'un export d'historique – choisir les{" "}
            <span className="fr-text--bold">données</span> que vous souhaitez
            collecter pour ces chantiers ou indicateurs, territoire par
            territoire : gouvernance, commentaires, données quantitatives, etc.
            (étape 3)
          </li>
        </ul>
      </MiseEnAvant>
      <p className="fr-my-1w">
        Dans un premier temps, indiquez les éléments dont vous souhaitez
        exporter les données :
      </p>
      <div className="fr-fieldset__element" key="chantiers">
        <div className="fr-radio-group">
          <input
            checked={typeExport === "chantiers"}
            id="chantiers"
            name="ressource-à-exporter"
            onChange={() => modifierTypeExport("chantiers")}
            type="radio"
          />
          <label className="fr-label" htmlFor="chantiers">
            les chantiers
          </label>
        </div>
      </div>
      <div className="fr-fieldset__element" key="indicateurs">
        <div className="fr-radio-group">
          <input
            checked={typeExport === "indicateurs"}
            id="indicateurs"
            name="ressource-à-exporter"
            onChange={() => modifierTypeExport("indicateurs")}
            type="radio"
          />
          <label className="fr-label" htmlFor="indicateurs">
            les indicateurs des chantiers
          </label>
        </div>
      </div>
      <div className="fr-fieldset__element" key="historique-indicateurs">
        <div className="fr-radio-group">
          <input
            checked={typeExport === "historique-indicateurs"}
            id="historique-indicateurs"
            name="ressource-à-exporter"
            onChange={() => modifierTypeExport("historique-indicateurs")}
            type="radio"
          />
          <label className="fr-label" htmlFor="historique-indicateurs">
            l'historique des indicateurs
          </label>
          <span className="fr-label fr-text--xs !text-dsfr-mention-grey fr-mb-0">
            Cet historique recense l'ensemble des valeurs d'avancement pour
            chaque indicateur et chaque territoire.
          </span>
        </div>
      </div>
      <div className="w-full flex justify-end fr-mt-2w">
        <Dialog.Close asChild>
          <button
            className="fr-link fr-mr-2w"
            title="Fermer la fenêtre modale"
            type="button"
          >
            Annuler
          </button>
        </Dialog.Close>
        <button
          className="fr-btn fr-mr-2w"
          onClick={() => setEtapeCourante(2)}
          type="button"
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
