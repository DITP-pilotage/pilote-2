import { Button } from "@/components/shared/Button";
import { Modale } from "@/components/shared/Modale";
import { Callout } from "@/components/shared/Callout";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { TYPES_EXPORT, useExportStep } from "./useExportStep";

type TypeExport = (typeof TYPES_EXPORT)[number];

const estTypeExport = (valeur: string): valeur is TypeExport =>
  TYPES_EXPORT.some((typeExport) => typeExport === valeur);

export const EtapeContenuAExporter = () => {
  const {
    exportState: { typeExport },
    updateExport,
    goToStep,
  } = useExportStep();

  const modifierTypeExport = (typeExportADefinir: TypeExport) =>
    updateExport({
      typeExport: typeExportADefinir,
      optionsExport:
        typeExportADefinir === "historique-indicateurs"
          ? "identifiant,valeur-cible,valeur-avancement"
          : "identifiant",
    });

  return (
    <div>
      <p className="fr-mt-2w fr-mb-2w">
        Sélectionnez et exportez les données de votre choix, selon vos besoins
      </p>
      <Callout.Root color="highlight">
        <Callout.Icon icone={QuestionIcon} />
        <Callout.Text>
          <Callout.Title className="text-base text-primary mb-1">
            Pour mener à bien votre export de données, vous allez être amené à :
          </Callout.Title>
          <ul>
            <li>
              indiquer les <span className="fr-text--bold">éléments</span> dont
              vous souhaitez récupérer les données : les chantiers, les
              indicateurs ou l'historique des indicateurs (étape 1) ;
            </li>
            <li>
              préciser le <span className="fr-text--bold">périmètre</span> de
              votre export : le cas échéant, filtrage des chantiers ou
              indicateurs et sélection des territoires (étape 2) ;
            </li>
            <li>
              enfin – s'il ne s'agit pas d'un export d'historique – choisir les{" "}
              <span className="fr-text--bold">données</span> que vous souhaitez
              collecter pour ces chantiers ou indicateurs, territoire par
              territoire : gouvernance, commentaires, données quantitatives,
              etc. (étape 3)
            </li>
          </ul>
        </Callout.Text>
      </Callout.Root>
      <p className="fr-my-1w">
        Dans un premier temps, indiquez les éléments dont vous souhaitez
        exporter les données :
      </p>
      <RadioGroup.Root
        name="ressource-à-exporter"
        onValueChange={(valeur) => {
          if (estTypeExport(valeur)) modifierTypeExport(valeur);
        }}
        value={typeExport}
      >
        <RadioGroup.Item
          id="chantiers"
          libelle="les chantiers"
          value="chantiers"
        />
        <RadioGroup.Item
          id="indicateurs"
          libelle="les indicateurs des chantiers"
          value="indicateurs"
        />
        <RadioGroup.Item
          aide="Cet historique recense l'ensemble des valeurs d'avancement pour chaque indicateur et chaque territoire."
          id="historique-indicateurs"
          libelle="l'historique des indicateurs"
          value="historique-indicateurs"
        />
      </RadioGroup.Root>
      <div className="w-full flex justify-end fr-mt-2w">
        <Modale.Close asChild>
          <button
            className="fr-link fr-mr-2w"
            title="Fermer la fenêtre modale"
            type="button"
          >
            Annuler
          </button>
        </Modale.Close>
        <Button
          variant="primary"
          className="mr-4"
          onClick={() => goToStep(2)}
          type="button"
        >
          Étape suivante
        </Button>
      </div>
    </div>
  );
};
