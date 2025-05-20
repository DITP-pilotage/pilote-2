import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { FunctionComponent, useState } from 'react';
import { Tag } from '@/components/_commons/Tag/Tag';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { reinitialiserFiltres, sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import { NOMS_CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import FiltresActifsStyled from './FiltresActifs.styled';
import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';

interface FiltresActifsProps {
  ministères: Ministère[]
  axes: Axe[]
  mailleSelectionnee: MailleInterne,
}

export const FiltresActifs: FunctionComponent<FiltresActifsProps> = ({ ministères, axes, mailleSelectionnee }) => {
  const [estOuvert, setEstOuvert] = useState(true);

  const [filtres, setFiltres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(''),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurActuelle: parseAsBoolean.withDefault(false),
  }, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });

  const nombreFiltresActifs = filtres.axes.split(',').filter(Boolean).length
    + filtres.perimetres.split(',').filter(Boolean).length
    + filtres.meteos.split(',').filter(Boolean).length
    + (filtres.estBarometre ? 1 : 0)
    + (filtres.territorialisation.split(',').filter(Boolean).length)
    + (filtres.estEnAlerteTauxAvancementNonCalculé ? 1 : 0)
    + (filtres.estEnAlerteÉcart ? 1 : 0)
    + (filtres.estEnAlerteBaisse ? 1 : 0)
    + (filtres.estEnAlerteMétéoNonRenseignée ? 1 : 0)
    + (filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? 1 : 0)
    + (filtres.estEnAlertePossedePropositionsValeurActuelle ? 1 : 0);

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [ministère.périmètresMinistériels[0].id, ministère.id]),
  );

  const retrouverNomFiltre = (idItemRecherche: string, listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[]) => {
    return listItems.find(item => item.id === idItemRecherche)!.nom;
  };

  const listePerimetres = ministères.flatMap(ministère => ministère.périmètresMinistériels);

  const désactiverTousLesFiltres = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    reinitialiserFiltres();

    return setFiltres({
      perimetres: '',
      axes: '',
      meteos: '',
      estBarometre: false,
      territorialisation: '',
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisse: false,
      estEnAlerteMétéoNonRenseignée: false,
      estEnAlerteAbscenceTauxAvancementDepartemental: false,
      estEnAlertePossedePropositionsValeurActuelle: false,
    });
  };

  return (
    <FiltresActifsStyled
      id='filtres-actifs'
    >
      <div
        aria-controls='filtres-actifs'
        aria-expanded={estOuvert}
        className='fr-accordion__btn flex align-center justify-between'
        onClick={() => setEstOuvert(!estOuvert)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            setEstOuvert(!estOuvert);
          }
        }}
        role='button'
        tabIndex={0}
      >
        <div className='flex'>
          <p className='fr-text--xs fr-mb-0 fr-pr-2w'>
            <span className='bold fr-text--xs fr-mb-0'>
              {nombreFiltresActifs}
            </span>
            {' '}
            {nombreFiltresActifs > 1 ? 'filtres actifs sur cette page' : 'filtre actif sur cette page'}
          </p>
          <button
            className='fr-link fr-icon-arrow-go-forward-fill fr-link--icon-left fr-text--xs'
            onClick={event => désactiverTousLesFiltres(event)}
            title='Réinitialiser les filtres'
            type='button'
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
      <div className={`${estOuvert ? 'fr-collapse--expanded' : 'fr-collapse'}`}>
        {
          filtres.estEnAlerteTauxAvancementNonCalculé || filtres.estEnAlerteÉcart || filtres.estEnAlerteBaisse || filtres.estEnAlerteMétéoNonRenseignée || filtres.estEnAlerteAbscenceTauxAvancementDepartemental || filtres.estEnAlertePossedePropositionsValeurActuelle ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  SIGNALEMENT :
                </span> 
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres ministère actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                    filtres.estEnAlerteTauxAvancementNonCalculé ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle="Taux d'avancement non calculé en raison d'indicateurs non renseignés"
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlerteTauxAvancementNonCalculé = false;
                            sauvegarderFiltres({ estEnAlerteTauxAvancementNonCalculé: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                  {
                    filtres.estEnAlerteÉcart ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlerteÉcart = false;

                            sauvegarderFiltres({ estEnAlerteÉcart: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                  {
                    filtres.estEnAlerteBaisse ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle='Chantier(s) avec tendance en baisse'
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlerteBaisse = false;

                            sauvegarderFiltres({ estEnAlerteBaisse: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                  {
                    filtres.estEnAlerteMétéoNonRenseignée ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle='Chantier(s) avec météo et synthèse des résultats non renseignés'
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlerteMétéoNonRenseignée = false;

                            sauvegarderFiltres({ estEnAlerteMétéoNonRenseignée: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                  {
                    filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle="Chantier(s) sans taux d'avancement au niveau départemental"
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlerteAbscenceTauxAvancementDepartemental = false;

                            sauvegarderFiltres({ estEnAlerteAbscenceTauxAvancementDepartemental: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                  {
                    filtres.estEnAlertePossedePropositionsValeurActuelle ? (
                      <li>
                        <Tag
                          color='warning'
                          doitAvoirUneTailleFixe
                          libelle="Chantier(s) avec proposition(s) de valeur d'avancement"
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estEnAlertePossedePropositionsValeurActuelle = false;

                            sauvegarderFiltres({ estEnAlertePossedePropositionsValeurActuelle: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                </ul>
              </div>
            </div>
          ) : null
        }
        {
          filtres.meteos ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  MÉTÉO :
                </span>
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres météo actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                filtres.meteos.split(',').filter(Boolean).map(meteo => (
                  <li
                    key={`tag-axe-${meteo}`}
                  >
                    <Tag
                      color='yellow-moutarde'
                      doitAvoirUneTailleFixe
                      libelle={libellésMétéos[meteo]}
                      size='sm'
                      suppressionCallback={() => {
                        let arrFiltreMeteos = filtres.meteos.split(',').filter(Boolean);
                        arrFiltreMeteos.splice(arrFiltreMeteos.indexOf(meteo), 1);

                        sauvegarderFiltres({ meteos: arrFiltreMeteos });
                        return setFiltres({ meteos: arrFiltreMeteos.join(',') });
                      }}
                    />
                  </li>
                ))
              } 
                </ul>
              </div>
            </div>
          ) : null
        }
        {
          filtres.perimetres ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  MINISTÈRE :
                </span>
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres ministère actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                filtres.perimetres.split(',').filter(Boolean).map(perimetreId => (
                  <li
                    key={`tag-axe-${perimetreId}`}
                  >
                    <Tag
                      doitAvoirUneTailleFixe
                      libelle={ministèresAvecUnSeulPérimètre.has(perimetreId) ? retrouverNomFiltre(ministèresAvecUnSeulPérimètre.get(perimetreId)!, ministères) : retrouverNomFiltre(perimetreId, listePerimetres)}
                      size='sm'
                      suppressionCallback={() => {
                        let arrFiltrePerimetres = filtres.perimetres.split(',').filter(Boolean);
                        arrFiltrePerimetres.splice(arrFiltrePerimetres.indexOf(perimetreId), 1);

                        sauvegarderFiltres({ perimetres: arrFiltrePerimetres });
                        return setFiltres({ perimetres: arrFiltrePerimetres.join(',') });
                      }}
                    />
                  </li>
                ))
              } 
                </ul>
              </div>
            </div>
          ) : null
        }
        {
          filtres.axes ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  AXE :
                </span>
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres axes actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                filtres.axes.split(',').filter(Boolean).map((axeId) => (
                  <li
                    key={`tag-axe-${axeId}`}
                  >
                    <Tag
                      doitAvoirUneTailleFixe
                      libelle={retrouverNomFiltre(axeId, axes)}
                      size='sm'
                      suppressionCallback={() => {
                        let arrFiltreAxes = filtres.axes.split(',').filter(Boolean);
                        arrFiltreAxes.splice(arrFiltreAxes.indexOf(axeId), 1);

                        sauvegarderFiltres({ axes: arrFiltreAxes });
                        return setFiltres({ axes: arrFiltreAxes.join(',') });
                      }}
                    />
                  </li>
                ),
                )
              }
                </ul>
              </div>
            </div>
          ) : null
        }
        {
          filtres.territorialisation ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  TERRITORIALISATION :
                </span>
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres territorialisation actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                    filtres.territorialisation.split(',').filter(Boolean).map(territorialisation => (
                      <li key={`tag-territorialisation-${territorialisation}`}>
                        <Tag
                          doitAvoirUneTailleFixe
                          libelle={NOMS_CODES_MAILLES[territorialisation as Maille]}
                          size='sm'
                          suppressionCallback={() => {
                            let arrFiltreTerritorialisation = filtres.territorialisation.split(',').filter(Boolean);
                            arrFiltreTerritorialisation.splice(arrFiltreTerritorialisation.indexOf(territorialisation), 1);

                            sauvegarderFiltres({ territorialisation: arrFiltreTerritorialisation });
                            return setFiltres({ territorialisation: arrFiltreTerritorialisation.join(',') });
                          }}
                        />
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          ) : null
        }
        {
          filtres.estBarometre ? (
            <div className='fr-grid-row'>
              <div className='fr-col-5 fr-col-sm-3 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold fr-text--xs fr-mb-0'>
                  AUTRE :
                </span>
              </div>
              <div className='fr-col-sm-9 fr-col-7'>
                <ul
                  aria-label='liste des tags des filtres baromètre actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                    filtres.estBarometre ? (
                      <li>
                        <Tag
                          doitAvoirUneTailleFixe
                          libelle='Chantiers du baromètre'
                          size='sm'
                          suppressionCallback={() => {
                            filtres.estBarometre = false;

                            sauvegarderFiltres({ estBarometre: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : null
                  }
                </ul>
              </div>
            </div>
          ) : null
        }
      </div>
    </FiltresActifsStyled>
  );
};
