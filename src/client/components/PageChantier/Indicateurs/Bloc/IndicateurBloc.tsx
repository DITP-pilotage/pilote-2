import { createColumnHelper } from '@tanstack/react-table';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurDétails
  from '@/components/PageChantier/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';
import IndicateurBlocStyled from './IndicateurBloc.styled';

function afficherValeurEtDate(valeur: number | null, date?: string | null) {
  const dateFormatée = formaterDate(date, 'mm/yyyy');
  return (
    <>
      <p className='indicateur-valeur'>
        {valeur?.toLocaleString()}
      </p>
      {
        !!dateFormatée && (
          <p className='indicateur-date-valeur texte-gris'>
            { `(${dateFormatée})` }
          </p>
        )
      }
    </>
  );
}

const reactTableColonnesHelper = createColumnHelper<Indicateur & { territoire: string }>();

const colonnes = [
  reactTableColonnesHelper.accessor('territoire', {
    header: 'Territoire(s)',
    cell: 'National',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurInitiale', {
    header: 'Valeur initiale',
    cell: valeurInitiale => afficherValeurEtDate(valeurInitiale.getValue(), valeurInitiale.row.original.dateValeurInitiale),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurActuelle', {
    header: 'Valeur actuelle',
    cell: valeurActuelle => afficherValeurEtDate(valeurActuelle.getValue(), valeurActuelle.row.original.dateValeurActuelle),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurCible', {
    header: 'Valeur cible',
    cell: valeurCible => afficherValeurEtDate(valeurCible.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('tauxAvancementGlobal', {
    header: 'Taux avancement global',
    cell: tauxAvancementGlobal => (
      <>
        {tauxAvancementGlobal.getValue() === null ? '- %' : `${tauxAvancementGlobal.getValue()!.toFixed(0)}%`}
        <BarreDeProgression
          afficherTexte={false}
          fond='bleu'
          taille='moyenne'
          valeur={tauxAvancementGlobal.getValue()}
          variante='primaire'
        />
      </>
    ),
    enableSorting: false, 
  }),
];

export default function IndicateurBloc({ indicateur } : IndicateurBlocProps) {
  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <Titre
          baliseHtml="h4"
          className="fr-h5 fr-mb-1w"
        >
          { !!indicateur.estIndicateurDuBaromètre && 
          <PictoBaromètre
            className='fr-mr-1w' 
            taille={{ mesure: 1.25, unité: 'rem' }} 
          /> }
          { indicateur.nom }
        </Titre>
        <p className='fr-mb-1w information-secondaire texte-gris'>
          Dernière mise à jour : Non renseigné
        </p>
        <p className='fr-mb-1w information-secondaire texte-gris'>
          Source : Non renseigné
        </p>
        <p className="fr-text--xs fr-mb-1v">
          Ceci est la description de l’indicateur et des données associées. La pondération de l’indicateur dans le taux d’avancement global est également expliquée.
        </p>
        <Tableau<Indicateur & { territoire: string }>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={[{ ...indicateur, territoire: 'National' }]}
          entité='indicateur'
        />
        <IndicateurDétails indicateur={indicateur} />
      </Bloc>
    </IndicateurBlocStyled>
  );
}
