import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs';
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
  }, {
    shallow: false,
    clearOnDefault: true,
  });

  const nombreFiltresActifs = filtres.axes.length + filtres.ppg.length + filtres.perimetres.length;

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
