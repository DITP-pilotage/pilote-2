import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import Tag from '@/components/_commons/Tag/Tag';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { reinitialiserFiltres, sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import FiltresActifsStyled from './FiltresActifs.styled';


interface FiltresActifsProps {
  ministères: Ministère[]
  axes: Axe[],
}


export default function FiltresActifs({ ministères, axes }: FiltresActifsProps) {
  const [filtres, setFiltres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  }, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });
  // Taux d’avancement non calculé en raison d’indicateurs non renseignés
  // Retard supérieur de 10 points par rapport à la moyenne nationale
  // Tendance(s) en baisse
  // Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour

  const nombreFiltresActifs = filtres.axes.split(',').filter(Boolean).length
    + filtres.perimetres.split(',').filter(Boolean).length
    + (filtres.estBarometre ? 1 : 0)
    + (filtres.estTerritorialise ? 1 : 0)
    + (filtres.estEnAlerteTauxAvancementNonCalculé ? 1 : 0)
    + (filtres.estEnAlerteÉcart ? 1 : 0)
    + (filtres.estEnAlerteBaisse ? 1 : 0)
    + (filtres.estEnAlerteMétéoNonRenseignée ? 1 : 0)
    + (filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? 1 : 0);

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [ministère.périmètresMinistériels[0].id, ministère.id]),
  );

  const retrouverNomFiltre = (idItemRecherche: string, listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[]) => {
    return listItems.find(item => item.id === idItemRecherche)!.nom;
  };

  const listePerimetres = ministères.flatMap(ministère => ministère.périmètresMinistériels);

  const désactiverTousLesFiltres = () => {
    reinitialiserFiltres();

    return setFiltres({
      perimetres: '',
      axes: '',
      estBarometre: false,
      estTerritorialise: false,
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisse: false,
      estEnAlerteMétéoNonRenseignée: false,
      estEnAlerteAbscenceTauxAvancementDepartemental: false,
    });
  };

  return (
    <FiltresActifsStyled
      className='fr-px-4w fr-py-2w'
      id='filtres-actifs'
    >
      <p className='fr-text--xs fr-mb-1w'>
        <span className='bold'>
          {nombreFiltresActifs}
        </span>
        {' '}
        {nombreFiltresActifs > 1 ? 'filtres actifs sur cette page' : 'filtre actif sur cette page'}
      </p>
      <ul
        aria-label='liste des tags des filtres actifs'
        className='conteneur-tags'
      >
        {
          filtres.perimetres.split(',').filter(Boolean).map(perimetreId => (
            <li
              key={`tag-axe-${perimetreId}`}
            >
              <Tag
                libellé={ministèresAvecUnSeulPérimètre.has(perimetreId) ? retrouverNomFiltre(ministèresAvecUnSeulPérimètre.get(perimetreId)!, ministères) : retrouverNomFiltre(perimetreId, listePerimetres)}
                suppressionCallback={() => {
                  let arrFiltrePerimetres = filtres.perimetres.split(',').filter(Boolean);
                  arrFiltrePerimetres.splice(filtres.perimetres.indexOf(perimetreId), 1);

                  sauvegarderFiltres({ perimetres: arrFiltrePerimetres });
                  return setFiltres({ perimetres: arrFiltrePerimetres.join(',') });
                }}
              />
            </li>
          ))
        }
        {
          filtres.axes.split(',').filter(Boolean).map((axeId) => (
            <li
              key={`tag-axe-${axeId}`}
            >
              <Tag
                libellé={retrouverNomFiltre(axeId, axes)}
                suppressionCallback={() => {
                  let arrFiltreAxes = filtres.axes.split(',').filter(Boolean);
                  arrFiltreAxes.splice(filtres.axes.indexOf(axeId), 1);

                  sauvegarderFiltres({ axes: arrFiltreAxes });
                  return setFiltres({ axes: arrFiltreAxes.join(',') });
                }}
              />
            </li>
          ),
          )
        }
        {
          filtres.estEnAlerteTauxAvancementNonCalculé ? (
            <li>
              <Tag
                libellé='Taux d’avancement non calculé en raison d’indicateurs non renseignés'
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
                libellé='Retard supérieur de 10 points par rapport à la moyenne nationale'
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
                libellé='Chantier(s) avec tendance en baisse'
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
          filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? (
            <li>
              <Tag
                libellé='Chantier(s) sans taux d’avancement au niveau départemental'
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
          filtres.estTerritorialise && filtres.estBarometre ? (
            <li>
              <Tag
                libellé='Chantiers du baromètre ou chantiers territorialisés'
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
                libellé='Chantiers baromètre'
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
                libellé='Chantiers territorialisés'
                suppressionCallback={() => {
                  filtres.estTerritorialise = false;

                  sauvegarderFiltres({ estTerritorialise: false });
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
                libellé='Chantiers avec météo et synthèse des résultats non renseignés'
                suppressionCallback={() => {
                  filtres.estEnAlerteMétéoNonRenseignée = false;

                  sauvegarderFiltres({ estEnAlerteMétéoNonRenseignée: false });
                  return setFiltres(filtres);
                }}
              />
            </li>
          ) : null
        }
      </ul>
      <button
        className='boutons fr-btn fr-btn--tertiary fr-mt-1w'
        onClick={désactiverTousLesFiltres}
        title='Réinitialiser les filtres'
        type='button'
      >
        Réinitialiser les filtres
      </button>
    </FiltresActifsStyled>
  );
}
