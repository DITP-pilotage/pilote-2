import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { PérimètreMinistériel } from "@/shared/perimetreMinisteriel/PerimetreMinisteriel.interface";
import { Axe } from "@/shared/axe/Axe.interface";
import { Ppg } from "@/shared/ppg/Ppg.interface";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { libellesMeteos } from "@/shared/meteo/Meteo.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { NOMS_CODES_MAILLES } from "@/shared/maille/mailleSQLParser";
import FiltresSélectionnésCatégorie from "./Catégorie/FiltresSélectionnésCatégorie";

interface FiltresSélectionnésProps {
  estAutoriseAVoirLesBrouillons: boolean;
  territoireSélectionné: DétailTerritoire | null;
  ministères: Ministère[];
  axes: Axe[];
}

const FiltresSélectionnés: FunctionComponent<FiltresSélectionnésProps> = ({
  estAutoriseAVoirLesBrouillons,
  territoireSélectionné,
  ministères,
  axes,
}) => {
  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(""),
    axes: parseAsString.withDefault(""),
    meteos: parseAsString.withDefault(""),
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(""),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental:
      parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurAvancement:
      parseAsBoolean.withDefault(false),
  });

  const listePerimetres = ministères.flatMap(
    (ministère) => ministère.périmètresMinistériels,
  );

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [
        ministère.périmètresMinistériels[0].id,
        ministère.id,
      ]),
  );

  const retrouverNomFiltre = (
    idItemRecherche: string,
    listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[],
  ) => {
    return listItems.find((item) => item.id === idItemRecherche)!.nom;
  };

  const filtresCatégories = [
    { nom: "Territoire", filtresActifs: [territoireSélectionné!.nomAffiché] },
    {
      nom: "Périmètres ministériels",
      filtresActifs: filtres.perimetres
        .split(",")
        .filter(Boolean)
        .map((perimetreId) =>
          ministèresAvecUnSeulPérimètre.has(perimetreId)
            ? retrouverNomFiltre(
                ministèresAvecUnSeulPérimètre.get(perimetreId)!,
                ministères,
              )
            : retrouverNomFiltre(perimetreId, listePerimetres),
        ),
    },
    {
      nom: "Axes",
      filtresActifs: filtres.axes
        .split(",")
        .filter(Boolean)
        .map((axeId) => retrouverNomFiltre(axeId, axes)),
    },
    {
      nom: "Territorialisation",
      filtresActifs: filtres.territorialisation
        .split(",")
        .filter(Boolean)
        .map((maille) => NOMS_CODES_MAILLES[maille as Maille]),
    },
    {
      nom: "Autres critères",
      filtresActifs: [
        filtres.estBarometre ? "Chantiers du baromètre" : null,
        estAutoriseAVoirLesBrouillons
          ? filtres.statut === "BROUILLON_ET_PUBLIE"
            ? "Chantiers validés et en cours de publication"
            : filtres.statut === "BROUILLON"
              ? "Chantiers en cours de publication"
              : filtres.statut === "ARCHIVE"
                ? "Chantiers archivés"
                : "Chantiers validés"
          : null,
      ].filter(Boolean),
    },
    {
      nom: "Alertes",
      filtresActifs: [
        filtres.estEnAlerteTauxAvancementNonCalculé
          ? "Taux d'avancement non calculé en raison d\'indicateurs non renseignés"
          : null,
        filtres.estEnAlerteÉcart
          ? `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${territoireSélectionné?.maille}`
          : null,
        filtres.estEnAlerteBaisse
          ? "Chantier(s) avec tendance en baisse"
          : null,
        filtres.estEnAlerteMétéoNonRenseignée
          ? "Chantier(s) avec météo et synthèse des résultats non renseignés"
          : null,
        filtres.estEnAlerteAbscenceTauxAvancementDepartemental
          ? "Chantier(s) sans taux d'avancement au niveau départemental"
          : null,
        filtres.estEnAlertePossedePropositionsValeurAvancement
          ? "Chantier(s) avec proposition(s) de valeur d'avancement"
          : null,
      ].filter(Boolean),
    },
    {
      nom: "Météos",
      filtresActifs: filtres.meteos
        .split(",")
        .filter(Boolean)
        .map((meteo) => libellesMeteos[meteo]),
    },
  ];

  return (
    <div className="fr-mb-2w print:hidden">
      <Titre baliseHtml="h2" className="fr-text--lg text-dsfr-grey-50">
        Contenu du rapport détaillé
      </Titre>
      <div className="columns-4 gap-8 pl-0 text-[0.95rem]">
        {filtresCatégories.map(({ nom, filtresActifs }) => (
          <FiltresSélectionnésCatégorie
            className="inline-block w-full"
            filtres={filtresActifs}
            key={nom}
            titre={nom}
          />
        ))}
      </div>
    </div>
  );
};

export default FiltresSélectionnés;
