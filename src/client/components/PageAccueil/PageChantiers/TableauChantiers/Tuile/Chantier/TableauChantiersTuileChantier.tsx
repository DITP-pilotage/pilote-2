import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauChantiersTuileChantierStyled from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tuile/Chantier/TableauChantiersTuileChantier.styled';
import TypologiesPictos from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauChantiersTuileChantierProps from './TableauChantiersTuileChantier.interface';

export default function TableauChantiersTuileChantier({ chantier }: TableauChantiersTuileChantierProps) {
  return (
    <TableauChantiersTuileChantierStyled>
      <div className="tuile-chantier-entête">
        <IcônesMultiplesEtTexte
          icônesId={chantier.porteur?.icône ? [chantier.porteur?.icône] : []}
        >
          {chantier.nom}
        </IcônesMultiplesEtTexte>
        <div className='fr-ml-2w'>
          <TypologiesPictos typologies={chantier.typologie} />
        </div>
      </div>
      <div className='fr-mt-1w tuile-chantier-corps'>
        <div className="météo">
          <MétéoPicto météo={chantier.météo} />
        </div>
        <div className='avancement fr-mr-2w'>
          <BarreDeProgression
            fond="blanc"
            taille="sm"
            valeur={chantier.avancement}
            variante='primaire'
          />
        </div>
      </div>
    </TableauChantiersTuileChantierStyled>
  );
}
