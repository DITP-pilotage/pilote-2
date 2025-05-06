import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { FunctionComponent, useState } from 'react';
import { Tag } from '@/components/_commons/Tag/Tag';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { reinitialiserFiltres, sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import FiltresActifsStyled from './FiltresActifs.styled';

interface FiltresActifsProps {
  ministères: Ministère[]
  axes: Axe[]
  mailleSelectionnee: MailleInterne,
}

const FiltresActifs: FunctionComponent<FiltresActifsProps> = ({ ministères, axes, mailleSelectionnee }) => {
  const [estOuvert, setEstOuvert] = useState(false);

  const [filtres, setFiltres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
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
    + (filtres.estTerritorialise ? 1 : 0)
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
      estTerritorialise: false,
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
      className='fr-px-2w fr-py-2w'
      id='filtres-actifs'
    >
      <div
        aria-controls='filtres-actifs'
        aria-expanded={estOuvert}
        className={`fr-accordion__btn flex align-center justify-between${estOuvert ? ' fr-mb-2w ' : ''}`}
        onClick={() => setEstOuvert(!estOuvert)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setEstOuvert(!estOuvert);
          }
        }}
        role='button'
        tabIndex={0}
      >
        <div className='flex'>
          <p className='fr-text--xs fr-mb-0 fr-pr-2w'>
            <span className='bold'>
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
        <span className={estOuvert ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} />
      </div>
      <div className={`${estOuvert ? 'fr-collapse--expanded' : 'fr-collapse'}`}>
        {
          filtres.estEnAlerteTauxAvancementNonCalculé || filtres.estEnAlerteÉcart || filtres.estEnAlerteBaisse || filtres.estEnAlerteMétéoNonRenseignée || filtres.estEnAlerteAbscenceTauxAvancementDepartemental || filtres.estEnAlertePossedePropositionsValeurActuelle ? (
            <div className='fr-grid-row'>
              <div className='fr-col-3 fr-col-xl-2 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold'>
                  SIGNALEMENTS :
                </span> 
              </div>
              <div className='fr-col-9 fr-col-xl-10'>
                <ul
                  aria-label='liste des tags des filtres ministère actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                    filtres.estEnAlerteTauxAvancementNonCalculé ? (
                      <li>
                        <Tag
                          color='warning'
                          libelle="Taux d'avancement non calculé en raison d'indicateurs non renseignés"
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
                          libelle={`Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleSelectionnee}`}
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
                          libelle='Chantier(s) avec tendance en baisse'
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
                          libelle='Chantier(s) avec météo et synthèse des résultats non renseignés'
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
                          libelle="Chantier(s) sans taux d'avancement au niveau départemental"
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
                          libelle="Chantier(s) avec proposition(s) de valeur d'avancement"
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
              <div className='fr-col-3 fr-col-xl-2 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold'>
                  MÉTÉO :
                </span>
              </div>
              <div className='fr-col-9 fr-col-xl-10'>
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
                      libelle={libellésMétéos[meteo]}
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
              <div className='fr-col-3 fr-col-xl-2 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold'>
                  MINISTÈRE :
                </span>
              </div>
              <div className='fr-col-9 fr-col-xl-10'>
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
                      libelle={ministèresAvecUnSeulPérimètre.has(perimetreId) ? retrouverNomFiltre(ministèresAvecUnSeulPérimètre.get(perimetreId)!, ministères) : retrouverNomFiltre(perimetreId, listePerimetres)}
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
              <div className='fr-col-3 fr-col-xl-2 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold'>
                  AXES :
                </span>
              </div>
              <div className='fr-col-9 fr-col-xl-10'>
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
                      libelle={retrouverNomFiltre(axeId, axes)}
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
          filtres.estBarometre || filtres.estTerritorialise ? (
            <div className='fr-grid-row'>
              <div className='fr-col-3 fr-col-xl-2 flex justify-end fr-pr-1w fr-pt-1v'>
                <span className='bold'>
                  AUTRE :
                </span>
              </div>
              <div className='fr-col-9 fr-col-xl-10'>
                <ul
                  aria-label='liste des tags des filtres baromètre actifs'
                  className='conteneur-tags fr-my-0'
                >
                  {
                    filtres.estTerritorialise && filtres.estBarometre ? (
                      <li>
                        <Tag
                          libelle='Chantiers du baromètre ou chantiers territorialisés'
                          suppressionCallback={() => {
                            filtres.estBarometre = false;
                            filtres.estTerritorialise = false;

                            sauvegarderFiltres({ estBarometre: false, estTerritorialise: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : filtres.estBarometre ? (
                      <li>
                        <Tag
                          libelle='Chantiers du baromètre'
                          suppressionCallback={() => {
                            filtres.estBarometre = false;

                            sauvegarderFiltres({ estBarometre: false });
                            return setFiltres(filtres);
                          }}
                        />
                      </li>
                    ) : filtres.estTerritorialise ? (
                      <li>
                        <Tag
                          libelle='Chantiers territorialisés'
                          suppressionCallback={() => {
                            filtres.estTerritorialise = false;

                            sauvegarderFiltres({ estTerritorialise: false });
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

export default FiltresActifs;
