import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";
import { TableauCoordinateurs } from "./TableauCoordinateurs";
import { TableauResponsables } from "./TableauResponsables";

const ONGLETS = [
  { value: "coordinateurs", label: "Coordinateurs PILOTE" },
  { value: "responsables", label: "Responsables locaux" },
] as const;

type Onglet = (typeof ONGLETS)[number]["value"];

const VALEURS_ONGLETS = ONGLETS.map((onglet) => onglet.value);

const estOnglet = (valeur: string): valeur is Onglet =>
  VALEURS_ONGLETS.some((onglet) => onglet === valeur);

// Changer d'onglet remet à zéro tous les paramètres des tableaux.
const PARAMETRES_TABLEAU_VIDES = {
  q: null,
  page: null,
  pageSize: null,
  sort: null,
  groupement: null,
  territoire: null,
  chantier: null,
};

const PARSEURS = {
  onglet: parseAsStringLiteral(VALEURS_ONGLETS).withDefault("coordinateurs"),
  q: parseAsString,
  page: parseAsString,
  pageSize: parseAsString,
  sort: parseAsString,
  groupement: parseAsString,
  territoire: parseAsString,
  chantier: parseAsString,
};

const PageAnnuaire = () => {
  const [{ onglet }, setParametres] = useQueryStates(PARSEURS, {
    history: "replace",
    shallow: true,
  });

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dsfr-grey-50">Annuaire</h1>
          <p className="!mb-0 mt-1 text-dsfr-grey-200">
            Retrouvez les coordinateurs PILOTE de chaque territoire et les
            responsables locaux de chaque chantier.
          </p>
        </div>
        <NavigationTertiaire
          items={[...ONGLETS]}
          onValueChange={(valeur) => {
            if (estOnglet(valeur)) {
              void setParametres({
                ...PARAMETRES_TABLEAU_VIDES,
                onglet: valeur,
              });
            }
          }}
          value={onglet}
        >
          <div className="mt-6">
            {onglet === "coordinateurs" ? (
              <TableauCoordinateurs />
            ) : (
              <TableauResponsables />
            )}
          </div>
        </NavigationTertiaire>
      </div>
    </div>
  );
};

export default PageAnnuaire;
