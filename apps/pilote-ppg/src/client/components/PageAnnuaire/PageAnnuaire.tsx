import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Tabs } from "@/components/shared/Tabs";
import { TableauCoordinateurs } from "./TableauCoordinateurs";
import { TableauResponsables } from "./TableauResponsables";

const ONGLETS = [
  { value: "coordinateurs", label: "Coordinateurs PILOTE" },
  { value: "responsables", label: "Responsables locaux" },
] as const;

const DESCRIPTIONS = {
  coordinateurs:
    "Interlocuteurs PILOTE de chaque région et de chaque département. Un territoire peut avoir plusieurs coordinateurs, et un coordinateur plusieurs territoires.",
  responsables:
    "Personnes habilitées en responsabilité sur un chantier pour une région ou un département. Un couple chantier – territoire peut compter plusieurs responsables.",
};

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="!mb-0 text-3xl font-bold tracking-tight text-dsfr-grey-50">
            Annuaire
          </h1>
          <p className="!mb-0 max-w-3xl text-base text-dsfr-grey-200">
            Retrouvez les coordinateurs PILOTE de chaque territoire et les
            responsables locaux de chaque chantier.
          </p>
        </div>
        <Tabs
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
          <p className="!mb-0 mt-4 text-sm text-dsfr-mention-grey">
            {DESCRIPTIONS[onglet]}
          </p>
          <div className="mt-4">
            {onglet === "coordinateurs" ? (
              <TableauCoordinateurs />
            ) : (
              <TableauResponsables />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default PageAnnuaire;
