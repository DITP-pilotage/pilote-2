import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { FunctionComponent } from "react";
import { formaterDate } from "@/client/utils/date/date";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import Ppg from "@/server/domain/ppg/Ppg.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { useEnv } from "@/client/hooks/useEnv";

interface PremièrePageImpressionRapportDétailléProps {
  territoireSélectionné: DétailTerritoire | null;
  estAutoriseAVoirLesBrouillons: boolean;
  ministères: Ministère[];
  axes: Axe[];
}

const PremièrePageImpressionRapportDétaillé: FunctionComponent<
  PremièrePageImpressionRapportDétailléProps
> = ({
  estAutoriseAVoirLesBrouillons,
  territoireSélectionné,
  ministères,
  axes,
}) => {
  const ffAlertes = useEnv("NEXT_PUBLIC_FF_ALERTES");
  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(""),
    axes: parseAsString.withDefault(""),
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental:
      parseAsBoolean.withDefault(false),
  });

  const listePerimetres = ministères.flatMap(
    (ministère) => ministère.périmètresMinistériels,
  );

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [
        ministère.id,
        ministère.périmètresMinistériels[0].id,
      ]),
  );

  const retrouverNomFiltre = (
    idItemRecherche: string,
    listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[],
  ) => {
    return listItems.find((item) => item.id === idItemRecherche)!.nom;
  };

  const perimetreActif = filtres.perimetres.split(",").filter(Boolean);

  const ministereAvecPerimetreActif = ministères.reduce((acc, ministere) => {
    if (
      ministèresAvecUnSeulPérimètre.has(ministere.id) &&
      perimetreActif.includes(
        ministèresAvecUnSeulPérimètre.get(ministere.id) || "",
      )
    ) {
      acc.set(ministere.id, {
        nom: ministere.nom,
        perimetres: [{ id: ministere.id, nom: ministere.nom }],
      });
    } else {
      perimetreActif.forEach((perimetre) => {
        if (
          ministere.périmètresMinistériels
            .map((périmètresMinistériel) => périmètresMinistériel.id)
            .includes(perimetre)
        ) {
          acc.set(ministere.id, {
            nom: ministere.nom,
            perimetres: [
              ...(acc.get(ministere.id)?.perimetres || []),
              {
                id: perimetre,
                nom: retrouverNomFiltre(perimetre, listePerimetres),
              },
            ],
          });
        }
      });
    }
    return acc;
  }, new Map<string, { nom: string; perimetres: { id: string; nom: string }[] }>());
  const filtresTypologie = [
    filtres.estBarometre ? "Chantiers du baromètre" : null,
    filtres.estTerritorialise ? "Chantiers territorialisés" : null,
    estAutoriseAVoirLesBrouillons
      ? filtres.statut === "BROUILLON_ET_PUBLIE"
        ? "Chantiers validés et en cours de publication"
        : filtres.statut === "BROUILLON"
          ? "Chantiers en cours de publication"
          : "Chantiers validés"
      : null,
  ].filter(Boolean);
  const filtresAlertes = [
    filtres.estEnAlerteTauxAvancementNonCalculé
      ? "Taux d'avancement non calculé en raison d\'indicateurs non renseignés"
      : null,
    filtres.estEnAlerteÉcart
      ? `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${territoireSélectionné?.maille}`
      : null,
    filtres.estEnAlerteBaisse ? "Chantier(s) avec tendance en baisse" : null,
    filtres.estEnAlerteMétéoNonRenseignée
      ? "Chantier(s) avec météo et synthèse des résultats non renseignés"
      : null,
    filtres.estEnAlerteAbscenceTauxAvancementDepartemental
      ? "Chantier(s) sans taux d'avancement au niveau départemental"
      : null,
  ].filter(Boolean);

  const filtresAxes = filtres.axes
    .split(",")
    .filter(Boolean)
    .map((axeId) => retrouverNomFiltre(axeId, axes));

  return (
    <div className="hidden print:block [page-break-after:always]">
      <header className="flex fr-px-12w fr-mb-6w" role="banner">
        <p className="fr-logo text-[0.7875rem]">Gouvernement</p>
        <div className="fr-pt-1w fr-ml-5w">
          <p className="fr-text--xl fr-text--bold fr-mb-0">PILOTE</p>
          <p className="fr-text--sm fr-mb-0">
            Piloter l'action publique par les résultats
          </p>
        </div>
      </header>
      <div className="fr-pt-6w fr-pb-3w bg-dsfr-alt-blue-france">
        <div className="fr-mb-6w fr-display--md text-center titre-rapport-détaillé">
          État des lieux de l'avancement
          <br />
          des politiques prioritaires
          <br />
          du Gouvernement
        </div>
        <div className="fr-px-12w">
          {`Rapport détaillé généré le ${formaterDate(new Date().toISOString(), "DD/MM/YYYY [à] H[h]mm")}`}
        </div>
      </div>
      <div className="fr-px-12w fr-py-4w max-h-[20cm]">
        <ul className="fr-pl-0 columns-[auto_2] gap-8 [column-fill:auto] list-none">
          <li className="pb-0">
            <span className="fr-text--bold text-[1.3rem] leading-7">
              Territoire sélectionné
            </span>
            <ul className="pl-4 [margin-block:0.25rem_0] mb-4">
              <li className="pb-0">{territoireSélectionné?.nomAffiché}</li>
            </ul>
          </li>
          {[...ministereAvecPerimetreActif].length > 0 ? (
            <li className="pb-0">
              <span className="fr-text--bold text-[1.3rem] leading-7">
                Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)
              </span>
              <ul className="pl-4 [margin-block:0.25rem_0] mb-4">
                {[...ministereAvecPerimetreActif].map(([, ministère]) => {
                  return (
                    <li className="pb-0" key={ministère.nom}>
                      <span className="fr-text--bold">{ministère.nom}</span>
                      <ul className="pl-5 [margin-block:0_0.25rem]">
                        {ministère.perimetres.map((périmètre) => (
                          <li className="pb-0" key={périmètre.id}>
                            {périmètre.nom}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </li>
          ) : null}
          {filtresTypologie.length > 0 && (
            <li className="pb-0">
              <span className="fr-text--bold text-[1.3rem] leading-7">
                Type(s) de chantier sélectionné(s)
              </span>
              <ul className="pl-4 [margin-block:0.25rem_0] mb-4">
                {filtresTypologie.map((typologie) => (
                  <li className="pb-0" key={typologie}>
                    {typologie}
                  </li>
                ))}
              </ul>
            </li>
          )}
          {filtresAxes.length > 0 && (
            <li className="pb-0">
              <span className="fr-text--bold text-[1.3rem] leading-7">
                Axe(s)
              </span>
              <ul className="pl-4 [margin-block:0.25rem_0] mb-4">
                {filtresAxes.map((axe) => (
                  <li className="pb-0" key={axe}>
                    {axe}
                  </li>
                ))}
              </ul>
            </li>
          )}
          {ffAlertes && filtresAlertes.length > 0 && (
            <li className="pb-0">
              <span className="fr-text--bold text-[1.3rem] leading-7">
                Alerte(s) sélectionnée(s)
              </span>
              <ul className="pl-4 [margin-block:0.25rem_0] mb-4">
                {filtresAlertes.map((alerte) => (
                  <li className="pb-0" key={alerte}>
                    {alerte}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PremièrePageImpressionRapportDétaillé;
