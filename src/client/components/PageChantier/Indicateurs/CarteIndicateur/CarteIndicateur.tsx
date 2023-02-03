import { createColumnHelper } from '@tanstack/react-table';
import IndicateurProps from '@/server/domain/indicateur/Indicateur.interface';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import CarteIndicateurProps from '@/components/PageChantier/Indicateurs/CarteIndicateur/CarteIndicateur.interface';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import CarteIndicateurStyled from './CarteIndicateur.styled';

const reactTableColonnesHelper = createColumnHelper<IndicateurProps & { territoire: string }>();

const colonnes = [
  reactTableColonnesHelper.accessor('territoire', {
    header: 'Territoire(s)',
    cell: 'National',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurInitiale', {
    header: 'Valeur initiale',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurActuelle', {
    header: 'Valeur actuelle',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('valeurCible', {
    header: 'Valeur cible',
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
    enableSorting: false }),
];

export default function CarteIndicateur({ indicateur } : CarteIndicateurProps) {
  return (
    <CarteIndicateurStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <Titre
          baliseHtml="h4"
          className="fr-h5 fr-mb-1w"
        >
          {
              !!indicateur.estIndicateurDuBaromètre && (
              <span
                aria-hidden="true"
                className="fr-icon-dashboard-3-line fr-mr-1w"
                style={{ color: '#006e6e' }}
              />
              )
          }
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
        <Tableau<IndicateurProps & { territoire: string }>
          afficherLaRecherche={false}
          colonnes={colonnes}
          données={[{ ...indicateur, territoire: 'National' }]}
          entité='indicateur'
        />
      </Bloc>
    </CarteIndicateurStyled>
  );
}
