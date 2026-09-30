import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { Modale } from "@/components/shared/Modale";
import { MiseEnAvant } from "@/components/_commons/MiseEnAvant/MiseEnAvant";
import { RadioGroup } from "@/components/shared/RadioGroup";

const TYPES_EXPORT = [
  "chantiers",
  "indicateurs",
  "historique-indicateurs",
] as const;

type TypeExport = (typeof TYPES_EXPORT)[number];

const estTypeExport = (valeur: string): valeur is TypeExport =>
  TYPES_EXPORT.some((typeExport) => typeExport === valeur);

export const EtapeContenuAExporter = () => {
  const [typeExport, setTypeExport] = useQueryState(
    "typeExport",
    parseAsStringLiteral(TYPES_EXPORT).withDefault("chantiers").withOptions({
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

  const modifierTypeExport = (typeExportADefinir: TypeExport) => {
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
