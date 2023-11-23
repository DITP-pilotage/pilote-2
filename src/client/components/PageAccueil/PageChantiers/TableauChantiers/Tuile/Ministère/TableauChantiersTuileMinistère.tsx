import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauChantiersTuileMinistèreStyled from './TableauChantiersTuileMinistère.styled';
import TableauChantiersTuileMinistèreProps from './TableauChantiersTuileMinistère.interface';

export default function TableauChantiersTuileMinistère({ ministère, estDéroulé }: TableauChantiersTuileMinistèreProps) {
  return (
    <TableauChantiersTuileMinistèreStyled>
      <div>
        <p className='fr-mb-0 fr-ml-n1w'>
          <IcônesMultiplesEtTexte
            icônesId={ministère.icône ? [ministère.icône] : []}
            largeurDesIcônes='1.75rem'
          >
            <span className='fr-text--sm'>
              {ministère?.nom ?? ''}
            </span>
          </IcônesMultiplesEtTexte>
        </p>
        <div className='fr-mx-3w fr-mt-1v avancement'>
          <BarreDeProgression
            fond='blanc'
            taille='sm'
            valeur={ministère.avancement}
            variante='primaire'
          />
        </div>
      </div>
      <button
        className={`${estDéroulé ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} chevron-accordéon`}
        type='button'
      />
    </TableauChantiersTuileMinistèreStyled>
  );
}
