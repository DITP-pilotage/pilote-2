import { createColumnHelper } from '@tanstack/react-table';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import BarreDeProgressionLégende from '@/components/_commons/BarreDeProgression/Légende/BarreDeProgressionLégende';
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
  reactTableColonnesHelper.accessor('avancement.global', {
    header: 'Avancement global',
    cell: () => (
      <BarreDeProgression
        fond="bleu"
        taille="moyenne"
        valeur={{
          minimum: 0,
          médiane: 0.82,
          moyenne: 0.75,
          maximum: 1,
        }}
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
      <Bloc>
        <Titre
          baliseHtml='h4'
          className='fr-text--lg'
        >
          Avancement
        </Titre>
        <Tableau<Chantier & { territoire: string }>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={[{ ...chantier, territoire: 'National' }]}
          entité='chantier'
        />
        <hr className='fr-hr fr-pb-2w' />
        <BarreDeProgressionLégende />
      </Bloc>
    </div>
  );
}
