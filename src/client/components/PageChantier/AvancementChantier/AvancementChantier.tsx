import { createColumnHelper } from '@tanstack/react-table';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { getLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import BarreDeProgressionLégende from '@/components/_commons/BarreDeProgression/Légende/BarreDeProgressionLégende';
import Météo from '@/server/domain/chantier/Météo.interface';
import AvancementChantierProps from './AvancementChantier.interface';

const reactTableColonnesHelper = createColumnHelper<Chantier>();

function afficherMétéo(météo: Météo) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE' ? <PictoMétéo valeur={météo} /> : getLibelléMétéo(météo);
}

const colonnes = [
  reactTableColonnesHelper.accessor('mailles', {
    header: 'Territoire(s)',
    cell: 'National',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('mailles.nationale.FR.météo', {
    header: 'Météo',
    cell: météo => afficherMétéo(météo.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('mailles.nationale.FR.avancement.global', {
    header: 'Avancement global',
    cell: (tauxDAvancement) => (
      <BarreDeProgression
        fond="bleu"
        maximum={100}
        minimum={0}
        médiane={82}
        taille="moyenne"
        valeur={tauxDAvancement.getValue()}
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
        <Tableau<Chantier>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={[chantier]}
          entité='chantier'
        />
        <hr className='fr-hr fr-pb-2w' />
        <BarreDeProgressionLégende />
      </Bloc>
    </div>
  );
}
