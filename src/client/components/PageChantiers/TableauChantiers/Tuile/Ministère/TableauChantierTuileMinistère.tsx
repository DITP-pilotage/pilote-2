import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauChantierTuileMinistèreStyled from './TableauChantierTuileMinistère.styled';
import TableauChantierTuileMinistèreProps from './TableauChantierTuileMinistère.interface';

export default function TableauChantierTuileMinistère({ ministère, estDéroulé }: TableauChantierTuileMinistèreProps) {
  return (
    <TableauChantierTuileMinistèreStyled>
      <div>
        <p>
          {ministère.nom}
        </p>
        <div className="fr-mx-3w fr-mt-1v avancement">
          <BarreDeProgression
            fond="blanc"
            taille="petite"
            valeur={ministère.avancement}
            variante='primaire'
          />
        </div>
      </div>
      <span
        aria-hidden="true"
        className={`${estDéroulé ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-up-s-line'} icone`}
      />
    </TableauChantierTuileMinistèreStyled>
  );
}
