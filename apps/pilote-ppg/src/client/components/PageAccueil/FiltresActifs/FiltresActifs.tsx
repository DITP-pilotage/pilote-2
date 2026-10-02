import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { Icone } from "@/components/_commons/Icone";
import { Collapsible } from "@/components/shared/Collapsible";
import { FunctionComponent, useState } from "react";
import { Tag } from "@/components/shared/Tag";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import Ppg from "@/server/domain/ppg/Ppg.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { sauvegarderFiltres } from "@/stores/useFiltresStore/useFiltresStore";
import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { NOMS_CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { listeStatuts } from "@/client/constants/statut";
import { BoutonReintialiserLesFiltres } from "@/components/PageAccueil/BoutonReintialiserLesFiltres";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

interface FiltresActifsProps {
  ministères: Ministère[];
  axes: Axe[];
  mailleSelectionnee: MailleInterne;
}

export const FiltresActifs: FunctionComponent<FiltresActifsProps> = ({
  ministères,
  axes,
  mailleSelectionnee,
}) => {
  const [estOuvert, setEstOuvert] = useState(true);

  const [filtres, setFiltres] = useQueryStates(
    {
      perimetres: parseAsString.withDefault(""),
      axes: parseAsString.withDefault(""),
      meteos: parseAsString.withDefault(""),
      statut: parseAsString.withDefault("PUBLIE"),
      estBarometre: parseAsBoolean.withDefault(false),
      territorialisation: parseAsString.withDefault(""),
      q: parseAsString.withDefault(""),
      estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
      estEnAlerteÉcart: parseAsBoolean.withDefault(false),
      estEnAlerteBaisse: parseAsBoolean.withDefault(false),
      estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
      estEnAlerteAbscenceTauxAvancementDepartemental:
        parseAsBoolean.withDefault(false),
      estEnAlertePossedePropositionsValeurAvancement:
        parseAsBoolean.withDefault(false),
    },
    {
      shallow: false,
      clearOnDefault: true,
      history: "push",
    },
  );

  const nombreFiltresActifs =
    filtres.axes.split(",").filter(Boolean).length +
    filtres.perimetres.split(",").filter(Boolean).length +
    filtres.meteos.split(",").filter(Boolean).length +
    (filtres.q ? 1 : 0) +
    (filtres.statut !== "PUBLIE" ? 1 : 0) +
    (filtres.estBarometre ? 1 : 0) +
    filtres.territorialisation.split(",").filter(Boolean).length +
    (filtres.estEnAlerteTauxAvancementNonCalculé ? 1 : 0) +
    (filtres.estEnAlerteÉcart ? 1 : 0) +
    (filtres.estEnAlerteBaisse ? 1 : 0) +
    (filtres.estEnAlerteMétéoNonRenseignée ? 1 : 0) +
    (filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? 1 : 0) +
    (filtres.estEnAlertePossedePropositionsValeurAvancement ? 1 : 0);

  if (nombreFiltresActifs === 0) {
    return null;
  }

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
    listItems:
      | Ministère[]
      | PérimètreMinistériel[]
      | Axe[]
      | Ppg[]
      | typeof listeStatuts,
  ) => {
    return listItems.find((item) => item.id === idItemRecherche)!.nom;
  };

  const listePerimetres = ministères.flatMap(
    (ministère) => ministère.périmètresMinistériels,
  );

  return (
    <Collapsible.Root
      className="sticky w-full top-0 z-[1] bg-dsfr-blue-france-925 shadow-[0_6px_18px_var(--shadow-color)] max-[992px]:top-14"
      id="filtres-actifs"
      onOpenChange={setEstOuvert}
      open={estOuvert}
    >
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <Collapsible.Trigger className="flex items-center gap-1 text-left">
          <span className="bold text-xs mb-0">{nombreFiltresActifs}</span>
          <span className="text-xs">
            {nombreFiltresActifs > 1
              ? "filtres actifs sur cette page"
              : "filtre actif sur cette page"}
          </span>
        </Collapsible.Trigger>
        <BoutonReintialiserLesFiltres />
        <Collapsible.Trigger
          aria-hidden="true"
          className="group ml-auto flex self-stretch items-center pl-4"
          tabIndex={-1}
        >
          <Icone
            className="w-5 h-5 text-current transition-transform duration-200 group-data-[state=open]:rotate-180"
            icone={ArrowSLine2Icon}
          />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content className="px-6 pb-4">
        {filtres.estEnAlerteTauxAvancementNonCalculé ||
        filtres.estEnAlerteÉcart ||
        filtres.estEnAlerteBaisse ||
        filtres.estEnAlerteMétéoNonRenseignée ||
        filtres.estEnAlerteAbscenceTauxAvancementDepartemental ||
        filtres.estEnAlertePossedePropositionsValeurAvancement ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">SIGNALEMENT :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              {filtres.estEnAlerteTauxAvancementNonCalculé ? (
                <Tag
                  aria-label="Taux d'avancement non calculé en raison d'indicateurs non renseignés"
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlerteTauxAvancementNonCalculé = false;
                    sauvegarderFiltres({
                      estEnAlerteTauxAvancementNonCalculé: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Taux d'avancement non calculé en raison d'indicateurs non
                  renseignés
                </Tag>
              ) : null}
              {filtres.estEnAlerteÉcart ? (
                <Tag
                  aria-label={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlerteÉcart = false;

                    sauvegarderFiltres({ estEnAlerteÉcart: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  {`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                </Tag>
              ) : null}
              {filtres.estEnAlerteBaisse ? (
                <Tag
                  aria-label="Chantier(s) avec tendance en baisse"
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlerteBaisse = false;

                    sauvegarderFiltres({ estEnAlerteBaisse: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Chantier(s) avec tendance en baisse
                </Tag>
              ) : null}
              {filtres.estEnAlerteMétéoNonRenseignée ? (
                <Tag
                  aria-label="Chantier(s) avec météo et synthèse des résultats non renseignés"
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlerteMétéoNonRenseignée = false;

                    sauvegarderFiltres({
                      estEnAlerteMétéoNonRenseignée: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Chantier(s) avec météo et synthèse des résultats non
                  renseignés
                </Tag>
              ) : null}
              {filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? (
                <Tag
                  aria-label="Chantier(s) sans taux d'avancement au niveau départemental"
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlerteAbscenceTauxAvancementDepartemental = false;

                    sauvegarderFiltres({
                      estEnAlerteAbscenceTauxAvancementDepartemental: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Chantier(s) sans taux d'avancement au niveau départemental
                </Tag>
              ) : null}
              {filtres.estEnAlertePossedePropositionsValeurAvancement ? (
                <Tag
                  aria-label="Retirer le tag Chantier(s) avec proposition(s) de valeur d'avancement"
                  variant="warning"
                  truncate
                  iconRight={CloseLineIcon}
                  onClick={() => {
                    filtres.estEnAlertePossedePropositionsValeurAvancement = false;

                    sauvegarderFiltres({
                      estEnAlertePossedePropositionsValeurAvancement: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Chantier(s) avec proposition(s) de valeur d'avancement
                </Tag>
              ) : null}
            </div>
          </div>
        ) : null}
        {filtres.meteos ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">MÉTÉO :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              <ul
                aria-label="liste des tags des filtres météo actifs"
                className="max-h-[7.5rem] ps-0 overflow-y-auto list-none my-0 gap-2 max-[992px]:overflow-x-auto max-[992px]:whitespace-nowrap"
              >
                {filtres.meteos
                  .split(",")
                  .filter(Boolean)
                  .map((meteo) => (
                    <li className="inline" key={`tag-axe-${meteo}`}>
                      <Tag
                        aria-label={`Retirer le tag ${libellesMeteos[meteo]}`}
                        variant="mustard"
                        truncate
                        iconRight={CloseLineIcon}
                        onClick={() => {
                          let arrFiltreMeteos = filtres.meteos
                            .split(",")
                            .filter(Boolean);
                          arrFiltreMeteos.splice(
                            arrFiltreMeteos.indexOf(meteo),
                            1,
                          );

                          sauvegarderFiltres({ meteos: arrFiltreMeteos });
                          return setFiltres({
                            meteos: arrFiltreMeteos.join(","),
                          });
                        }}
                        size="sm"
                      >
                        {libellesMeteos[meteo]}
                      </Tag>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.perimetres ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">MINISTÈRE :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              {filtres.perimetres
                .split(",")
                .filter(Boolean)
                .map((perimetreId) => (
                  <Tag
                    aria-label={`Retirer le tag ${
                      ministèresAvecUnSeulPérimètre.has(perimetreId)
                        ? retrouverNomFiltre(
                            ministèresAvecUnSeulPérimètre.get(perimetreId)!,
                            ministères,
                          )
                        : retrouverNomFiltre(perimetreId, listePerimetres)
                    }`}
                    truncate
                    iconRight={CloseLineIcon}
                    variant="active"
                    key={`tag-axe-${perimetreId}`}
                    onClick={() => {
                      let arrFiltrePerimetres = filtres.perimetres
                        .split(",")
                        .filter(Boolean);
                      arrFiltrePerimetres.splice(
                        arrFiltrePerimetres.indexOf(perimetreId),
                        1,
                      );

                      sauvegarderFiltres({
                        perimetres: arrFiltrePerimetres,
                      });
                      return setFiltres({
                        perimetres: arrFiltrePerimetres.join(","),
                      });
                    }}
                    size="sm"
                  >
                    {ministèresAvecUnSeulPérimètre.has(perimetreId)
                      ? retrouverNomFiltre(
                          ministèresAvecUnSeulPérimètre.get(perimetreId)!,
                          ministères,
                        )
                      : retrouverNomFiltre(perimetreId, listePerimetres)}
                  </Tag>
                ))}
            </div>
          </div>
        ) : null}
        {filtres.axes ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">AXE :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              {filtres.axes
                .split(",")
                .filter(Boolean)
                .map((axeId) => (
                  <Tag
                    aria-label={`Retirer le tag ${retrouverNomFiltre(axeId, axes)}`}
                    truncate
                    iconRight={CloseLineIcon}
                    variant="active"
                    key={`tag-axe-${axeId}`}
                    onClick={() => {
                      let arrFiltreAxes = filtres.axes
                        .split(",")
                        .filter(Boolean);
                      arrFiltreAxes.splice(arrFiltreAxes.indexOf(axeId), 1);

                      sauvegarderFiltres({ axes: arrFiltreAxes });
                      return setFiltres({ axes: arrFiltreAxes.join(",") });
                    }}
                    size="sm"
                  >
                    {retrouverNomFiltre(axeId, axes)}
                  </Tag>
                ))}
            </div>
          </div>
        ) : null}
        {filtres.statut && filtres.statut !== "PUBLIE" ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">STATUT :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              <Tag
                aria-label={`Retirer le tag ${retrouverNomFiltre(filtres.statut, listeStatuts)}`}
                truncate
                iconRight={CloseLineIcon}
                variant="active"
                key={`tag-statut-${filtres.statut}`}
                onClick={() => {
                  sauvegarderFiltres({ statut: "PUBLIE" });
                  return setFiltres({ statut: "PUBLIE" });
                }}
                size="sm"
              >
                {retrouverNomFiltre(filtres.statut, listeStatuts)}
              </Tag>
            </div>
          </div>
        ) : null}
        {filtres.territorialisation ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">
                TERRITORIALISATION :
              </span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              {filtres.territorialisation
                .split(",")
                .filter(Boolean)
                .map((territorialisation) => (
                  <Tag
                    aria-label={`Retirer le tag ${NOMS_CODES_MAILLES[territorialisation as Maille]}`}
                    truncate
                    iconRight={CloseLineIcon}
                    variant="active"
                    key={`tag-territorialisation-${territorialisation}`}
                    onClick={() => {
                      let arrFiltreTerritorialisation =
                        filtres.territorialisation.split(",").filter(Boolean);
                      arrFiltreTerritorialisation.splice(
                        arrFiltreTerritorialisation.indexOf(territorialisation),
                        1,
                      );

                      sauvegarderFiltres({
                        territorialisation: arrFiltreTerritorialisation,
                      });
                      return setFiltres({
                        territorialisation:
                          arrFiltreTerritorialisation.join(","),
                      });
                    }}
                    size="sm"
                  >
                    {NOMS_CODES_MAILLES[territorialisation as Maille]}
                  </Tag>
                ))}
            </div>
          </div>
        ) : null}
        {filtres.estBarometre ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">AUTRE :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              {filtres.estBarometre ? (
                <Tag
                  aria-label="Retirer le tag Chantiers du baromètre"
                  truncate
                  iconRight={CloseLineIcon}
                  variant="active"
                  onClick={() => {
                    filtres.estBarometre = false;

                    sauvegarderFiltres({ estBarometre: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                >
                  Chantiers du baromètre
                </Tag>
              ) : null}
            </div>
          </div>
        ) : null}
        {filtres.q ? (
          <div className="grid grid-cols-12">
            <div className="col-span-5 sm:col-span-3 lg:col-span-2 flex justify-end pr-2 pt-1">
              <span className="font-bold text-xs mb-0">RECHERCHE :</span>
            </div>
            <div className="col-span-7 sm:col-span-9 lg:col-span-10 flex gap-1">
              <Tag
                aria-label={`Retirer le tag ${filtres.q}`}
                variant="info"
                truncate
                iconRight={CloseLineIcon}
                onClick={() => {
                  sauvegarderFiltres({ q: "" });
                  return setFiltres({ q: "" });
                }}
                size="sm"
              >
                {filtres.q}
              </Tag>
            </div>
          </div>
        ) : null}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
