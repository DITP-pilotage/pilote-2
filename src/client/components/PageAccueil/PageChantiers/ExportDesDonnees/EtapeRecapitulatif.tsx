import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Dialog } from "radix-ui";
import { horodatage } from "@/client/utils/date/date";
import api from "@/server/infrastructure/api/trpc/api";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";

const ressources = {
  chantiers: {
    id: "chantiers" as const,
    baseDuNomDeFichier: "PILOTE-Chantiers",
    url: "/api/export/chantiers-v2",
  },
  indicateurs: {
    id: "indicateurs" as const,
    baseDuNomDeFichier: "PILOTE-Indicateurs",
    url: "/api/export/indicateurs-v2",
  },
  "historique-indicateurs": {
    id: "historique-indicateurs" as const,
    baseDuNomDeFichier: "PILOTE-Historique-Indicateurs",
    url: "/api/export/historique-indicateurs",
  },
};

const chantierDonneesExportable = {
  identifiant: "identifiants du chantier et du territoire",
  gouvernance: "gouvernance du chantier",
  responsabilite: "responsabilité du chantier",
  objectif: "objectifs du chantier",
  description: "données descriptives du chantier sur le territoire",
  comparaison: "données de comparaison du chantier",
  synthese: "météo et synthèse des résultats du chantier sur le territoire",
  commentaire: "commentaires du chantier",
  decision: "suivi des décisions stratégiques du chantier",
};

const indicateurDonneesExportable = {
  identifiant:
    "identifiants de l'indicateur, de la chantier associée et du territoire",
  cadrage: "cadrage de l'indicateur",
  gouvernance: "gouvernance de l'indicateur et du chantier associé",
  responsabilite: "responsabilités de l'indicateur et du chantier associé",
  objectif:
    "objectifs du chantier associé : notre ambition, ce qui a déjà été fait, ce qui reste à faire",
  description: "données de l'indicateur sur le territoire",
  "description-chantier": "données du chantier associé sur le territoire",
  comparaison: "données de comparaison de l'indicateur",
  synthese:
    "météo et synthèse des résultats du chantier associé sur le territoire",
  commentaire: "commentaires du chantier associé",
  decision: "suivi des décisions stratégiques du chantier associé",
};

const historiqueIndicateurDonneesExportable = {
  identifiant: "identifiants de l'indicateur et du territoire",
  "valeur-cible":
    "valeur initiale et valeurs cibles de l'indicateur sur le territoire les valeurs cibles sont exportées pour l'année en cours et pour l'année 2026",
  "valeur-avancement":
    "valeurs d'avancements de l'indicateur sur le territoire, mois par mois",
};

export const EtapeRecapitulatif = ({
  territoireCodeSelectionne,
}: {
  territoireCodeSelectionne: string;
}) => {
  const [, setEtapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
    }),
  );

  const { data: dataBasculeValeurAnneePrecedente } =
    api.gestionContenu.recupererVariableContenu.useQuery({
      nomVariableContenu:
        "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
    });

  const { listeJalonAAfficher } = useSelecteurJalon();
  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(""),
    meteos: parseAsString.withDefault(""),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(""),
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]).withDefault("PUBLIE"),
    jalon: parseAsStringLiteral(listeJalonAAfficher).withDefault(
      getAnneeDateDeBascule(
        new Date(),
        dataBasculeValeurAnneePrecedente as string,
      ).toString() as "2024" | "2025",
    ),
    optionsExport: parseAsString.withDefault("identifiant"),
    isAvecFiltre: parseAsBoolean.withDefault(false),
    typeExport: parseAsStringLiteral([
      "chantiers",
      "indicateurs",
      "historique-indicateurs",
    ]).withDefault("chantiers"),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental:
      parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurAvancement:
      parseAsBoolean.withDefault(false),
  });

  const arrayOptionsExport: {
    name: string;
    value: string | boolean;
  }[] = filtres.perimetres
    .split(",")
    .filter(Boolean)
    .map((filtrePerimetreMinisteriel) => ({
      name: "perimetreIds",
      value: filtrePerimetreMinisteriel,
    }));

  if (filtres.estBarometre) {
    arrayOptionsExport.push({ name: "estBarometre", value: true });
  }

  filtres.meteos
    .split(",")
    .filter(Boolean)
    .forEach((filtreMeteo) => {
      arrayOptionsExport.push({ name: "meteos", value: filtreMeteo });
    });

  if (filtres.territorialisation) {
    arrayOptionsExport.push({
      name: "territorialisation",
      value: filtres.territorialisation,
    });
  }

  if (filtres.isAvecFiltre) {
    arrayOptionsExport.push({
      name: "territoireCode",
      value: territoireCodeSelectionne,
    });
  }

  const listeStatuts =
    filtres.statut === "BROUILLON_ET_PUBLIE"
      ? ["BROUILLON", "PUBLIE"]
      : [filtres.statut];
  listeStatuts.forEach((statut) => {
    arrayOptionsExport.push({ name: "statut", value: statut });
  });

  arrayOptionsExport.push({ name: "jalon", value: filtres.jalon });

  if (filtres.estEnAlerteAbscenceTauxAvancementDepartemental) {
    arrayOptionsExport.push({
      name: "estEnAlerteAbscenceTauxAvancementDepartemental",
      value: true,
    });
  }

  if (filtres.estEnAlerteBaisse) {
    arrayOptionsExport.push({ name: "estEnAlerteBaisse", value: true });
  }

  if (filtres.estEnAlerteMétéoNonRenseignée) {
    arrayOptionsExport.push({
      name: "estEnAlerteMétéoNonRenseignée",
      value: true,
    });
  }

  if (filtres.estEnAlertePossedePropositionsValeurAvancement) {
    arrayOptionsExport.push({
      name: "estEnAlertePossedePropositionsValeurAvancement",
      value: true,
    });
  }

  if (filtres.estEnAlerteTauxAvancementNonCalculé) {
    arrayOptionsExport.push({
      name: "estEnAlerteTauxAvancementNonCalculé",
      value: true,
    });
  }

  if (filtres.estEnAlerteÉcart) {
    arrayOptionsExport.push({ name: "estEnAlerteÉcart", value: true });
  }

  const arrayDonneeAExporter =
    filtres.typeExport === "chantiers"
      ? chantierDonneesExportable
      : filtres.typeExport === "indicateurs"
        ? indicateurDonneesExportable
        : historiqueIndicateurDonneesExportable;

  return (
    <div>
      <p className="fr-mt-2w fr-mb-2w">
        Veuillez vérifier ci-dessous le contenu de votre fichier d'export :
      </p>
      <h3 className="fr-text--md fr-mb-0 fr-mt-2w">Éléments à exporter</h3>
      <p className="flex gap-2">
        <Icone className="text-dsfr-success-425" icone={CheckLineIcon} />
        {filtres.typeExport === "chantiers" ? (
          <span>chantiers</span>
        ) : filtres.typeExport === "indicateurs" ? (
          <span>indicateurs</span>
        ) : (
          <span>historique des indicateurs</span>
        )}
      </p>
      <h3 className="fr-text--md fr-mb-0 fr-mt-2w">Périmètre de l'export</h3>
      <p className="flex gap-2">
        <Icone className="text-dsfr-success-425" icone={CheckLineIcon} />
        {filtres.isAvecFiltre ? (
          <span>
            export des éléments correspondant aux filtres activés dans PILOTE
          </span>
        ) : (
          <span>
            export de tous les éléments sur tous les territoires ouverts en
            lecture
          </span>
        )}
      </p>
      <h3 className="fr-text--md fr-mb-0 fr-mt-2w">Données collectées</h3>
      <ul className="list-style-none fr-pl-0">
        {Object.entries(arrayDonneeAExporter)
          .filter(([key]) => filtres.optionsExport.includes(key))
          .map(([key, value]) => {
            return (
              <li className="flex gap-2" key={key}>
                <Icone
                  className="text-dsfr-success-425"
                  icone={CheckLineIcon}
                />
                {value}
              </li>
            );
          })}
      </ul>
      <form
        className="fr-mt-2w"
        data-testid="form-export"
        onSubmit={(événement) => {
          événement.preventDefault();
          const { url, baseDuNomDeFichier } = ressources[filtres.typeExport];
          if (url) {
            const a = window.document.createElement("a");
            const strOptionsExport = `${arrayOptionsExport.map((option) => `${option.name}=${option.value}`).join("&")}`;
            a.href = `${url}?${filtres.optionsExport
              .split(",")
              .filter(Boolean)
              .map((option) => `optionsExport=${option}`)
              .join(
                "&",
              )}${filtres.isAvecFiltre && arrayOptionsExport.length > 0 ? `&${strOptionsExport}` : ""}`;
            a.target = "_self";
            a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
            document.body.append(a);
            a.click();
            a.remove();
            setEtapeCourante(5);
          }
        }}
      >
        <div className="w-full flex justify-end fr-mt-2w gap-4">
          <Dialog.Close asChild>
            <button
              className="!text-primary font-medium !px-4"
              title="Fermer la fenêtre modale"
              type="button"
            >
              Annuler
            </button>
          </Dialog.Close>
          <button
            className="!text-primary font-medium !border !border-primary !py-2 !px-4"
            onClick={() => setEtapeCourante(3)}
            type="button"
          >
            Étape précédente
          </button>
          <button
            className="!bg-primary font-medium !text-white rounded flex align-center gap-2 !px-4"
            type="submit"
          >
            <Icone className="!text-current w-4 h-4" icone={Download1Icon} />
            Exporter les données
          </button>
        </div>
      </form>
    </div>
  );
};
