import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import Tag from '@/components/_commons/Tag/Tag';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import FiltresActifsStyled from './FiltresActifs.styled';


interface FiltresActifsProps {
  ministères: Ministère[]
  axes: Axe[],
  ppg: Ppg[],
}


export default function FiltresActifs({ ministères, axes, ppg } : FiltresActifsProps) {
  const [filtres, setFiltres] = useQueryStates({
    perimetres: parseAsArrayOf(parseAsString).withDefault([]),
    axes: parseAsArrayOf(parseAsString).withDefault([]),
    ppg: parseAsArrayOf(parseAsString).withDefault([]),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisseOuStagnation: parseAsBoolean.withDefault(false),
    estEnAlerteDonnéesNonMàj: parseAsBoolean.withDefault(false),
  }, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });
  // Taux d’avancement non calculé en raison d’indicateurs non renseignés
  // Retard supérieur de 10 points par rapport à la moyenne nationale
  // Tendance(s) en baisse ou en stagnation
  // Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour

  const nombreFiltresActifs = filtres.axes.length
    + filtres.ppg.length
    + filtres.perimetres.length
    + (filtres.estBarometre ? 1 : 0)
    + (filtres.estTerritorialise ? 1 : 0)
    + (filtres.estEnAlerteTauxAvancementNonCalculé ? 1 : 0)
    + (filtres.estEnAlerteÉcart ? 1 : 0)
    + (filtres.estEnAlerteBaisseOuStagnation ? 1 : 0)
    + (filtres.estEnAlerteDonnéesNonMàj ? 1 : 0);

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [ministère.périmètresMinistériels[0].id, ministère.id]),
  );

  const retrouverNomFiltre = (idItemRecherche: string, listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[]) => listItems.find(item => item.id === idItemRecherche)!.nom;

  const listePerimetres = ministères.flatMap(ministère => ministère.périmètresMinistériels);

  const désactiverTousLesFiltres = () => {
    return setFiltres({
      perimetres: [],
      axes: [],
      ppg: [],
      estBarometre: false,
      estTerritorialise: false,
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisseOuStagnation: false,
      estEnAlerteDonnéesNonMàj: false,
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
          filtres.perimetres.map(perimetreId => (
            <li
              key={`tag-axe-${perimetreId}`}
            >
              <Tag
                libellé={ministèresAvecUnSeulPérimètre.has(perimetreId) ? retrouverNomFiltre(ministèresAvecUnSeulPérimètre.get(perimetreId)!, ministères) : retrouverNomFiltre(perimetreId, listePerimetres)}
                suppressionCallback={() => {
                  filtres.perimetres.splice(filtres.perimetres.indexOf(perimetreId), 1);
                  return setFiltres(filtres);
                }}
              />
            </li>
          ))
        }
        {
          filtres.axes.map((axeId) => (
            <li
              key={`tag-axe-${axeId}`}
            >
              <Tag
                libellé={retrouverNomFiltre(axeId, axes)}
                suppressionCallback={() => {
                  filtres.axes.splice(filtres.axes.indexOf(axeId), 1);
                  return setFiltres(filtres);
                }}
              />
            </li>
          ),
          )
        }
        {
          filtres.ppg.map((ppgId) => (
            <li
              key={`tag-axe-${ppgId}`}
            >
              <Tag
                libellé={retrouverNomFiltre(ppgId, ppg)}
                suppressionCallback={() => {
                  filtres.ppg.splice(filtres.axes.indexOf(ppgId), 1);
                  return setFiltres(filtres);
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
                  return setFiltres(filtres);
                }}
              />
            </li>
          ) : null
        }
        {
          filtres.estEnAlerteBaisseOuStagnation ? (
            <li>
              <Tag
                libellé='Tendance(s) en baisse ou en stagnation'
                suppressionCallback={() => {
                  filtres.estEnAlerteBaisseOuStagnation = false;
                  return setFiltres(filtres);
                }}
              />
            </li>
          ) : null
        }
        {
          filtres.estEnAlerteDonnéesNonMàj ? (
            <li>
              <Tag
                libellé='Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour'
                suppressionCallback={() => {
                  filtres.estEnAlerteDonnéesNonMàj = false;
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
        type='button'
      >
        Réinitialiser les filtres
      </button>
    </FiltresActifsStyled>
  );
}
