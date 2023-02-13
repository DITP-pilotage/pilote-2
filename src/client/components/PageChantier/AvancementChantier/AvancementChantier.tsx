import { createColumnHelper } from '@tanstack/react-table';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Tableau from '@/components/_commons/Tableau/Tableau';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { récupérerLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import BarreDeProgressionLégende from '@/components/_commons/BarreDeProgression/Légende/BarreDeProgressionLégende';
import Météo from '@/server/domain/chantier/Météo.interface';
import { ChantierTerritorialisé } from '@/server/domain/chantier/Chantier.interface';
import AvancementChantierProps from './AvancementChantier.interface';

const reactTableColonnesHelper = createColumnHelper<ChantierTerritorialisé>();

function afficherMétéo(météo: Météo) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE' ? <PictoMétéo valeur={météo} /> : récupérerLibelléMétéo(météo);
}

function afficherTerritoire(territoire: ChantierTerritorialisé['territoire']) {
  return (
    territoire.maille === 'départementale' ? (
      <span>
        {`${territoire.codeInsee} - ${territoire.nom}`}
      </span>
    ) : (
      <span>
        {territoire.nom}
      </span>
    )
  );
}

const colonnes = [
  reactTableColonnesHelper.accessor('territoire', {
    header: 'Territoire(s)',
    cell: territoire => (afficherTerritoire(territoire.getValue())),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('météoTerritoire', {
    header: 'Météo',
    cell: météo => afficherMétéo(météo.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('avancementGlobalTerritoire', {
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
        <Tableau<ChantierTerritorialisé>
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
