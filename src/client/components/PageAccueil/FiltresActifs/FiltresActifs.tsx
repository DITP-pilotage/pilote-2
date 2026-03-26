import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { FunctionComponent, useState } from "react";
import { Tag } from "@/components/_commons/Tag/Tag";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import Ppg from "@/server/domain/ppg/Ppg.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { NOMS_CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { listeStatuts } from "@/client/constants/statut";
import { BoutonReintialiserLesFiltres } from "@/components/PageAccueil/BoutonReintialiserLesFiltres";
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";
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
    <div
      className="sticky w-full top-0 z-[1] bg-dsfr-blue-france-925 shadow-[0_6px_18px_var(--shadow-color)] max-[992px]:top-14"
      id="filtres-actifs"
    >
      <div
        aria-controls="filtres-actifs"
        aria-expanded={estOuvert}
        className="fr-accordion__btn flex items-center justify-between px-6 pt-6 pb-4 cursor-pointer"
        onClick={() => setEstOuvert(!estOuvert)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            setEstOuvert(!estOuvert);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex gap-2">
          <div className="flex align-center gap-1">
            <span className="bold text-xs mb-0">{nombreFiltresActifs}</span>
            <span className="text-xs">
              {nombreFiltresActifs > 1
                ? "filtres actifs sur cette page"
                : "filtre actif sur cette page"}
            </span>
          </div>
          <BoutonReintialiserLesFiltres />
        </div>
      </div>
      <div
        className={`${estOuvert ? "fr-collapse--expanded px-6 pb-4" : "fr-collapse"}`}
      >
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
                  ariaLabel="Taux d'avancement non calculé en raison d'indicateurs non renseignés"
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle="Taux d'avancement non calculé en raison d'indicateurs non renseignés"
                  onClick={() => {
                    filtres.estEnAlerteTauxAvancementNonCalculé = false;
                    sauvegarderFiltres({
                      estEnAlerteTauxAvancementNonCalculé: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
              ) : null}
              {filtres.estEnAlerteÉcart ? (
                <Tag
                  ariaLabel={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                  onClick={() => {
                    filtres.estEnAlerteÉcart = false;

                    sauvegarderFiltres({ estEnAlerteÉcart: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
              ) : null}
              {filtres.estEnAlerteBaisse ? (
                <Tag
                  ariaLabel="Chantier(s) avec tendance en baisse"
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle="Chantier(s) avec tendance en baisse"
                  onClick={() => {
                    filtres.estEnAlerteBaisse = false;

                    sauvegarderFiltres({ estEnAlerteBaisse: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
              ) : null}
              {filtres.estEnAlerteMétéoNonRenseignée ? (
                <Tag
                  ariaLabel="Chantier(s) avec météo et synthèse des résultats non renseignés"
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle="Chantier(s) avec météo et synthèse des résultats non renseignés"
                  onClick={() => {
                    filtres.estEnAlerteMétéoNonRenseignée = false;

                    sauvegarderFiltres({
                      estEnAlerteMétéoNonRenseignée: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
              ) : null}
              {filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? (
                <Tag
                  ariaLabel="Chantier(s) sans taux d'avancement au niveau départemental"
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle="Chantier(s) sans taux d'avancement au niveau départemental"
                  onClick={() => {
                    filtres.estEnAlerteAbscenceTauxAvancementDepartemental = false;

                    sauvegarderFiltres({
                      estEnAlerteAbscenceTauxAvancementDepartemental: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
              ) : null}
              {filtres.estEnAlertePossedePropositionsValeurAvancement ? (
                <Tag
                  ariaLabel="Retirer le tag Chantier(s) avec proposition(s) de valeur d'avancement"
                  color="warning"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  libelle="Chantier(s) avec proposition(s) de valeur d'avancement"
                  onClick={() => {
                    filtres.estEnAlertePossedePropositionsValeurAvancement = false;

                    sauvegarderFiltres({
                      estEnAlertePossedePropositionsValeurAvancement: false,
                    });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
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
                className="max-h-[7.5rem] ps-0 overflow-y-auto list-none children:inline my-0 gap-2 max-[992px]:overflow-x-auto max-[992px]:whitespace-nowrap"
              >
                {filtres.meteos
                  .split(",")
                  .filter(Boolean)
                  .map((meteo) => (
                    <li key={`tag-axe-${meteo}`}>
                      <Tag
                        ariaLabel={`Retirer le tag ${libellesMeteos[meteo]}`}
                        color="yellow-moutarde"
                        doitAvoirUneTailleFixe
                        iconRight={CloseLineIcon}
                        libelle={libellesMeteos[meteo]}
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
                      />
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
                    ariaLabel={`Retirer le tag ${
                      ministèresAvecUnSeulPérimètre.has(perimetreId)
                        ? retrouverNomFiltre(
                            ministèresAvecUnSeulPérimètre.get(perimetreId)!,
                            ministères,
                          )
                        : retrouverNomFiltre(perimetreId, listePerimetres)
                    }`}
                    doitAvoirUneTailleFixe
                    iconRight={CloseLineIcon}
                    isActive
                    key={`tag-axe-${perimetreId}`}
                    libelle={
                      ministèresAvecUnSeulPérimètre.has(perimetreId)
                        ? retrouverNomFiltre(
                            ministèresAvecUnSeulPérimètre.get(perimetreId)!,
                            ministères,
                          )
                        : retrouverNomFiltre(perimetreId, listePerimetres)
                    }
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
                  />
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
                    ariaLabel={`Retirer le tag ${retrouverNomFiltre(axeId, axes)}`}
                    doitAvoirUneTailleFixe
                    iconRight={CloseLineIcon}
                    isActive
                    key={`tag-axe-${axeId}`}
                    libelle={retrouverNomFiltre(axeId, axes)}
                    onClick={() => {
                      let arrFiltreAxes = filtres.axes
                        .split(",")
                        .filter(Boolean);
                      arrFiltreAxes.splice(arrFiltreAxes.indexOf(axeId), 1);

                      sauvegarderFiltres({ axes: arrFiltreAxes });
                      return setFiltres({ axes: arrFiltreAxes.join(",") });
                    }}
                    size="sm"
                  />
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
                ariaLabel={`Retirer le tag ${retrouverNomFiltre(filtres.statut, listeStatuts)}`}
                doitAvoirUneTailleFixe
                iconRight={CloseLineIcon}
                isActive
                key={`tag-statut-${filtres.statut}`}
                libelle={retrouverNomFiltre(filtres.statut, listeStatuts)}
                onClick={() => {
                  sauvegarderFiltres({ statut: "PUBLIE" });
                  return setFiltres({ statut: "PUBLIE" });
                }}
                size="sm"
              />
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
                    ariaLabel={`Retirer le tag ${NOMS_CODES_MAILLES[territorialisation as Maille]}`}
                    doitAvoirUneTailleFixe
                    iconRight={CloseLineIcon}
                    isActive
                    key={`tag-territorialisation-${territorialisation}`}
                    libelle={NOMS_CODES_MAILLES[territorialisation as Maille]}
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
                  />
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
                  ariaLabel="Retirer le tag Chantiers du baromètre"
                  doitAvoirUneTailleFixe
                  iconRight={CloseLineIcon}
                  isActive
                  libelle="Chantiers du baromètre"
                  onClick={() => {
                    filtres.estBarometre = false;

                    sauvegarderFiltres({ estBarometre: false });
                    return setFiltres(filtres);
                  }}
                  size="sm"
                />
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
                ariaLabel={`Retirer le tag ${filtres.q}`}
                color="blue-info-main"
                doitAvoirUneTailleFixe
                iconRight={CloseLineIcon}
                libelle={filtres.q}
                onClick={() => {
                  sauvegarderFiltres({ q: "" });
                  return setFiltres({ q: "" });
                }}
                size="sm"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
