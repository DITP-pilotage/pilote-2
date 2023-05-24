import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauChantiersTuileMinistèreStyled from './TableauChantiersTuileMinistère.styled';
import TableauChantiersTuileMinistèreProps from './TableauChantiersTuileMinistère.interface';

export default function TableauChantiersTuileMinistère({ ministère, estDéroulé, icônes }: TableauChantiersTuileMinistèreProps) {
  return (
    <TableauChantiersTuileMinistèreStyled>
      <div>
        <IcônesMultiplesEtTexte
          icônesId={icônes}
        >
          {ministère.nom}
        </IcônesMultiplesEtTexte>
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
        className={`${estDéroulé ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} chevron-accordéon`}
      />
    </TableauChantiersTuileMinistèreStyled>
  );
}
