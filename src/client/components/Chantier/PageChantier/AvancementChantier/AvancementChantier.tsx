import { createColumnHelper } from '@tanstack/react-table';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import { mettreEnFormeLaMétéo } from '@/client/utils/météos';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import AvancementChantierProps from './AvancementChantier.interface';



function afficherBarreDeProgressionAnnuelle(avancement: number | null) {
  return (
    <BarreDeProgression
      fond="blanc"
      taille="petite"
      valeur={avancement}
      variante='secondaire'
    />
  );
}

function afficherBarreDeProgressionGlobale(avancement: number | null) {
  return (
    <BarreDeProgression
      fond="blanc"
      taille="petite"
      valeur={avancement}
      variante='primaire'
    />
  );
}

const reactTableColonnesHelper = createColumnHelper<Chantier>();

const colonnes = [
  reactTableColonnesHelper.accessor('territoire', {
    header: 'Territoire(s)',
    cell: 'National',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => mettreEnFormeLaMétéo(météo.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('avancement.annuel', {
    header: 'Avancement annuel',
    cell: avancement => afficherBarreDeProgressionAnnuelle(avancement.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('avancement.global', {
    header: 'Avancement global',
    cell: avancement => afficherBarreDeProgressionGlobale(avancement.getValue()),
    enableSorting: false,
  }),
];


export default function AvancementChantier({ chantier }: AvancementChantierProps) {
  return (
    <div
      className='fr-pb-10w'
      id="avancement"
    >
      <Titre baliseHtml='h2'>
        Avancement du chantier
      </Titre>
      <p className='fr-my-4w'>
        Mode de calcul:  Le taux d’avancement du chantier est la moyenne pondérée des taux d’avancement des indicateurs de ce chantier.
      </p>
      <CarteSquelette>
        <Titre
          apparence='fr-text--lg'
          baliseHtml='h5'
        >
          Avancement
        </Titre>
        <Tableau<typeof chantier>
          afficherLaRecherche={false}
          afficherLeTitre={false}
          colonnes={colonnes}
          données={[chantier]}
          entité='chantier'
          titre="Avancement"
        />
      </CarteSquelette>
    </div>
  );
}
