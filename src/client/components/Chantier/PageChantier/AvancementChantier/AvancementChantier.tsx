import { createColumnHelper } from '@tanstack/react-table';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import {
  barreDeProgressionCurseurGéométries,
} from '@/components/_commons/BarreDeProgression/BarreDeProgressionCurseur/BarreDeProgressionCurseur';
import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/BarreDeProgressionCurseur/BarreDeProgressionCurseur.interface';
import AvancementChantierProps from './AvancementChantier.interface';
import styles from './AvancementChantier.module.scss';

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
        fond="bleu"
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
        fond="bleu"
        taille="petite"
        valeur={avancement.getValue()}
        variante='primaire'
      />
    ),
    enableSorting: false,
  }),
];

function afficherLaLégendePourUnCurseurDeBarreDeProgression(
  typeDeCurseur: TypeDeCurseur,
  libellé: string,
) {
  return (
    <li className={`${styles.curseurConteneur} fr-pr-2w`}>
      <svg
        className={styles.curseur}
        viewBox="-12 -20 24 24"
        width="0.75rem"
        xmlns="http://www.w3.org/2000/svg"
      >
        { barreDeProgressionCurseurGéométries[typeDeCurseur] }
      </svg>
      <span className="fr-pl-1v fr-m-0 fr-text--xs">
        { libellé }
      </span>
    </li>
  );
}


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
        <hr className='fr-hr fr-pb-2w' />
        <ul className={styles.légendeBarreDeProgressionCurseurs}>
          { afficherLaLégendePourUnCurseurDeBarreDeProgression(TypeDeCurseur.MINIMUM, 'Minimum') }
          { afficherLaLégendePourUnCurseurDeBarreDeProgression(TypeDeCurseur.MÉDIANE, 'Médiane') }
          { afficherLaLégendePourUnCurseurDeBarreDeProgression(TypeDeCurseur.MAXIMUM, 'Maximum') }
        </ul>
      </CarteSquelette>
    </div>
  );
}
