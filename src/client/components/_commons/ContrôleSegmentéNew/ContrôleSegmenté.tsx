import '@gouvfr/dsfr/dist/component/segmented/segmented.css';
import ContrôleSegmentéStyled from './ContrôleSegmenté.styled';

type ContrôleSegmentéOption<T> = {
  libellé: string,
  valeur: T,
};

interface ContrôleSegmentéProps<T> {
  options: ContrôleSegmentéOption<T>[]
  valeurSélectionnée: T
  valeurModifiéeCallback: (valeur: T) => void
}

export default function ContrôleSegmenté<T extends string>({
  options,
  valeurSélectionnée,
  valeurModifiéeCallback,
}: ContrôleSegmentéProps<T>) {

  return (
    <ContrôleSegmentéStyled>
      <div className='flex'>
        {
          options.map(option => (
            <button
              className={`fr-tag fr-mr-1w${valeurSélectionnée === option.valeur ? ' fr-tag-active' : ''}`}
              id={option.valeur}
              key={option.valeur}
              onClick={() => valeurSélectionnée !== option.valeur && valeurModifiéeCallback(option.valeur)}
              type='button'
            >
              {option.libellé}
            </button>
          ))
        }
      </div>
    </ContrôleSegmentéStyled>
  );
}
