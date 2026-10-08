import { parseAsString, useQueryState } from "nuqs";
import { ExportOption, ExportOptionsSection } from "./ExportOptionsSection";
import { CollectStepFooter } from "./CollectStepFooter";

const OPTIONS_DEFINITION: ExportOption[] = [
  {
    value: "identifiant",
    disabled: true,
    label: (
      <>
        <span className="font-bold">identifiants</span> de l'indicateur et du
        territoire
      </>
    ),
  },
  {
    value: "valeur-cible",
    disabled: true,
    label: (
      <>
        <span className="font-bold">valeur initiale et valeurs cibles*</span> de
        l'indicateur sur le territoire
      </>
    ),
    hint: "*les valeurs cibles sont fournies pour l'année en cours et à échéance",
  },
  {
    value: "valeur-avancement",
    disabled: true,
    label: (
      <>
        <span className="font-bold">valeurs d'avancement</span> de l'indicateur
        sur le territoire, mois par mois
      </>
    ),
  },
];

export const EtapeDonneeHistoriqueIndicateurACollecter = () => {
  const [optionsExport] = useQueryState(
    "optionsExport",
    parseAsString
      .withDefault("identifiant,valeur-cible,valeur-avancement")
      .withOptions({
        shallow: true,
      }),
  );

  return (
    <div>
      <p className="mt-4 mb-0">
        Vous avez choisi d'exporter{" "}
        <strong>l'historique des indicateurs.</strong>
      </p>
      <p className="mt-2 mb-0">
        Pour chacun des indicateurs et des territoires inclus dans le périmètre
        d'export, les données collectées sont les suivantes :
      </p>
      <ExportOptionsSection
        className="pb-4"
        options={OPTIONS_DEFINITION}
        selectedOptions={optionsExport.split(",")}
        title="DÉFINITION"
      />
      <CollectStepFooter />
    </div>
  );
};
