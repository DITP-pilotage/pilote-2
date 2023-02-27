import { createColumnHelper } from '@tanstack/react-table';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurBlocProps from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import IndicateurDétails from '@/components/PageChantier/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import { IndicateurDonnéesParTerritoire } from '../Indicateurs.interface';
import useIndicateurs from '../useIndicateurs';

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

const reactTableColonnesHelper = createColumnHelper<IndicateurDonnéesParTerritoire>();

const colonnes = [
  reactTableColonnesHelper.accessor( 'territoire', {
    header: 'Territoire(s)',
    cell: nomDuTerritoire => nomDuTerritoire.getValue(),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('données.valeurInitiale', {
    header: 'Valeur initiale',
    cell: valeurInitiale => afficherValeurEtDate(valeurInitiale.getValue(), valeurInitiale.row.original.données.dateValeurInitiale),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('données.valeurActuelle', {
    header: 'Valeur actuelle',
    cell: valeurActuelle => afficherValeurEtDate(valeurActuelle.getValue(), valeurActuelle.row.original.données.dateValeurActuelle),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('données.valeurCible', {
    header: 'Valeur cible',
    cell: valeurCible => afficherValeurEtDate(valeurCible.getValue()),
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('données.avancement.global', {
    header: 'Taux avancement global',
    cell: avancementGlobal => (
      <>
        {avancementGlobal.getValue() === null ? '- %' : `${avancementGlobal.getValue()!.toFixed(0)}%`}
        <BarreDeProgression
          afficherTexte={false}
          fond='bleu'
          taille='moyenne'
          valeur={avancementGlobal.getValue()}
          variante='primaire'
        />
      </>
    ),
    enableSorting: false, 
  }),
];

export default function IndicateurBloc({ indicateur, indicateurMétriques } : IndicateurBlocProps) {
  const { indicateurDonnéesParTerritoires } = useIndicateurs(indicateurMétriques);  
  
  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <Titre
          baliseHtml="h4"
          className="fr-text--xl fr-mb-1w"
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
        <Tableau<IndicateurDonnéesParTerritoire>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={indicateurDonnéesParTerritoires}
          entité='indicateur'
        />
        <IndicateurDétails indicateur={indicateur} />
      </Bloc>
    </IndicateurBlocStyled>
  );
}
