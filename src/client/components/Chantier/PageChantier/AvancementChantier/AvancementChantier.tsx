import { createColumnHelper } from '@tanstack/react-table';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import AvancementChantierProps from './AvancementChantier.interface';

const reactTableColonnesHelper = createColumnHelper<Chantier & { territoire: string }>();

const colonnes = [
  reactTableColonnesHelper.accessor('territoire', {
    header: 'Territoire(s)',
    cell: 'National',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => <PictoMétéo valeur={météo.getValue()} />,
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('avancement.annuel', {
    header: 'Avancement annuel',
    cell: avancement => (
      <BarreDeProgression
        fond="blanc"
        taille="petite"
        valeur={avancement.getValue()}
        variante='secondaire'
      />
    ),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('avancement.global', {
    header: 'Avancement global',
    cell: avancement => (
      <BarreDeProgression
        fond="blanc"
        taille="petite"
        valeur={avancement.getValue()}
        variante='primaire'
      />
    ),
    enableSorting: false,
  }),
];


export default function AvancementChantier({ chantier }: AvancementChantierProps) {
  return (
    <div
      className='fr-pb-5w'
      id="avancement"
    >
      <Titre baliseHtml='h2'>
        Avancement du chantier
      </Titre>
      <p className='fr-my-4w'>
        Mode de calcul :  le taux d’avancement du chantier est la moyenne pondérée des taux d’avancement des indicateurs de ce chantier.
      </p>
      <CarteSquelette>
        <Titre
          apparence='fr-text--lg'
          baliseHtml='h4'
        >
          Avancement
        </Titre>
        <Tableau<Chantier & { territoire: string }>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={[{ ...chantier, territoire: 'National' }]}
          entité='chantier'
        />
        <hr className='fr-hr' />
      </CarteSquelette>
    </div>
  );
}
