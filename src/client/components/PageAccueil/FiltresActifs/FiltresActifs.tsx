import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { FunctionComponent, useState } from "react";
import { Tag } from "@/components/_commons/Tag/Tag";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import Ppg from "@/server/domain/ppg/Ppg.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import { libellésMétéos } from "@/server/domain/météo/Météo.interface";
import { NOMS_CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { listeStatuts } from "@/client/constants/statut";
import { BoutonReintialiserLesFiltres } from "@/components/PageAccueil/BoutonReintialiserLesFiltres";
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import FiltresActifsStyled from "./FiltresActifs.styled";

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
    <FiltresActifsStyled id="filtres-actifs">
      <div
        aria-controls="filtres-actifs"
        aria-expanded={estOuvert}
        className="fr-accordion__btn flex align-center justify-between fr-px-3w fr-pt-3w fr-pb-2w"
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
        className={`${estOuvert ? "fr-collapse--expanded fr-px-3w fr-pb-2w" : "fr-collapse"}`}
      >
        {filtres.estEnAlerteTauxAvancementNonCalculé ||
        filtres.estEnAlerteÉcart ||
        filtres.estEnAlerteBaisse ||
        filtres.estEnAlerteMétéoNonRenseignée ||
        filtres.estEnAlerteAbscenceTauxAvancementDepartemental ||
        filtres.estEnAlertePossedePropositionsValeurAvancement ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">SIGNALEMENT :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres ministère actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.estEnAlerteTauxAvancementNonCalculé ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
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
                  </li>
                ) : null}
                {filtres.estEnAlerteÉcart ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
                      libelle={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                      onClick={() => {
                        filtres.estEnAlerteÉcart = false;

                        sauvegarderFiltres({ estEnAlerteÉcart: false });
                        return setFiltres(filtres);
                      }}
                      size="sm"
                    />
                  </li>
                ) : null}
                {filtres.estEnAlerteBaisse ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
                      libelle="Chantier(s) avec tendance en baisse"
                      onClick={() => {
                        filtres.estEnAlerteBaisse = false;

                        sauvegarderFiltres({ estEnAlerteBaisse: false });
                        return setFiltres(filtres);
                      }}
                      size="sm"
                    />
                  </li>
                ) : null}
                {filtres.estEnAlerteMétéoNonRenseignée ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
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
                  </li>
                ) : null}
                {filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
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
                  </li>
                ) : null}
                {filtres.estEnAlertePossedePropositionsValeurAvancement ? (
                  <li>
                    <Tag
                      color="warning"
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
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
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.meteos ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">MÉTÉO :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres météo actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.meteos
                  .split(",")
                  .filter(Boolean)
                  .map((meteo) => (
                    <li key={`tag-axe-${meteo}`}>
                      <Tag
                        color="yellow-moutarde"
                        doitAvoirUneTailleFixe
                        iconRight={
                          <Icone
                            className="w-4 h-4 !text-current"
                            icone={CloseLineIcon}
                          />
                        }
                        libelle={libellésMétéos[meteo]}
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
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">MINISTÈRE :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres ministère actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.perimetres
                  .split(",")
                  .filter(Boolean)
                  .map((perimetreId) => (
                    <li key={`tag-axe-${perimetreId}`}>
                      <Tag
                        doitAvoirUneTailleFixe
                        iconRight={
                          <Icone
                            className="w-4 h-4 !text-current"
                            icone={CloseLineIcon}
                          />
                        }
                        isActive
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
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.axes ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">AXE :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres axes actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.axes
                  .split(",")
                  .filter(Boolean)
                  .map((axeId) => (
                    <li key={`tag-axe-${axeId}`}>
                      <Tag
                        doitAvoirUneTailleFixe
                        iconRight={
                          <Icone
                            className="w-4 h-4 !text-current"
                            icone={CloseLineIcon}
                          />
                        }
                        isActive
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
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.statut && filtres.statut !== "PUBLIE" ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">STATUT :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres statut actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                <li key={`tag-statut-${filtres.statut}`}>
                  <Tag
                    doitAvoirUneTailleFixe
                    iconRight={
                      <Icone
                        className="w-4 h-4 !text-current"
                        icone={CloseLineIcon}
                      />
                    }
                    isActive
                    libelle={retrouverNomFiltre(filtres.statut, listeStatuts)}
                    onClick={() => {
                      sauvegarderFiltres({ statut: "PUBLIE" });
                      return setFiltres({ statut: "PUBLIE" });
                    }}
                    size="sm"
                  />
                </li>
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.territorialisation ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">
                TERRITORIALISATION :
              </span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres territorialisation actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.territorialisation
                  .split(",")
                  .filter(Boolean)
                  .map((territorialisation) => (
                    <li key={`tag-territorialisation-${territorialisation}`}>
                      <Tag
                        doitAvoirUneTailleFixe
                        iconRight={
                          <Icone
                            className="w-4 h-4 !text-current"
                            icone={CloseLineIcon}
                          />
                        }
                        isActive
                        libelle={
                          NOMS_CODES_MAILLES[territorialisation as Maille]
                        }
                        onClick={() => {
                          let arrFiltreTerritorialisation =
                            filtres.territorialisation
                              .split(",")
                              .filter(Boolean);
                          arrFiltreTerritorialisation.splice(
                            arrFiltreTerritorialisation.indexOf(
                              territorialisation,
                            ),
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
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.estBarometre ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">AUTRE :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres baromètre actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                {filtres.estBarometre ? (
                  <li>
                    <Tag
                      doitAvoirUneTailleFixe
                      iconRight={
                        <Icone
                          className="w-4 h-4 !text-current"
                          icone={CloseLineIcon}
                        />
                      }
                      isActive
                      libelle="Chantiers du baromètre"
                      onClick={() => {
                        filtres.estBarometre = false;

                        sauvegarderFiltres({ estBarometre: false });
                        return setFiltres(filtres);
                      }}
                      size="sm"
                    />
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
        {filtres.q ? (
          <div className="fr-grid-row">
            <div className="fr-col-lg-2 fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v">
              <span className="bold fr-text--xs fr-mb-0">RECHERCHE :</span>
            </div>
            <div className="fr-col-lg-10 fr-col-sm-9 fr-col-7">
              <ul
                aria-label="liste des tags des filtres recherche actifs"
                className="conteneur-tags fr-my-0 gap-2"
              >
                <li>
                  <Tag
                    color="blue-info-main"
                    doitAvoirUneTailleFixe
                    iconRight={
                      <Icone
                        className="w-4 h-4 !text-current"
                        icone={CloseLineIcon}
                      />
                    }
                    libelle={filtres.q}
                    onClick={() => {
                      sauvegarderFiltres({ q: "" });
                      return setFiltres({ q: "" });
                    }}
                    size="sm"
                  />
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </FiltresActifsStyled>
  );
};
