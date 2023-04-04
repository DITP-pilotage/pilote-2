import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauChantiersTuileMinistèreStyled from './TableauChantiersTuileMinistère.styled';
import TableauChantiersTuileMinistèreProps from './TableauChantiersTuileMinistère.interface';

export default function TableauChantiersTuileMinistère({ ministère, estDéroulé }: TableauChantiersTuileMinistèreProps) {
  return (
    <TableauChantiersTuileMinistèreStyled>
      <div>
        <p className="fr-text--sm">
          {ministère.nom}
        </p>
        <div className="fr-mx-3w fr-mt-1v avancement">
          <BarreDeProgression
            fond="blanc"
            taille="sm"
            valeur={ministère.avancement}
            variante='primaire'
          />
        </div>
      </div>
      <span
        aria-hidden="true"
        className={`${estDéroulé ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-up-s-line'} chevron-accordéon`}
      />
    </TableauChantiersTuileMinistèreStyled>
  );
}
