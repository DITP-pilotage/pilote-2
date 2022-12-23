import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { createColumnHelper } from '@tanstack/react-table';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/Chantier/PageChantier/Indicateurs/Indicateurs.interface';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import styles from './Indicateurs.module.scss';

const reactTableColonnesHelper = createColumnHelper<Indicateur & { territoire: string }>();

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
    cell: tauxAvancementGlobal => (<BarreDeProgression
      taille='petite'
      valeur={tauxAvancementGlobal.getValue()}
      variante='primaire'
                                   />),
    enableSorting: false }),
];


export default function Indicateurs({ listeRubriquesIndicateurs, indicateurs }: IndicateursProps) {
  return (
    <div
      className='fr-pb-5w'
      id="indicateurs"
    >
      <Titre baliseHtml='h2'>
        Indicateurs
      </Titre>
      <p>
        Explications sur la pondération des indicateurs (à rédiger).
      </p>
      { listeRubriquesIndicateurs.map(rubriqueIndicateurs => (

        <div
          className='fr-mb-4w'
          id={rubriqueIndicateurs.ancre}
          key={rubriqueIndicateurs.ancre}
        >
          <Titre
            baliseHtml='h3'
            className='fr-h4'
          >
            {rubriqueIndicateurs.nom}
          </Titre>
          {
            indicateurs
              .filter(indicateur => indicateur.type === rubriqueIndicateurs.typeIndicateur)
              .map(indicateur => (
                <div
                  className="fr-mb-2w"
                  key={indicateur.id}
                >
                  <CarteSquelette>
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
                    <p className={`${styles.infoSecondaire} fr-mb-1w`}>
                      Dernière mise à jour : 13/12/2022
                    </p>
                    <p className={`${styles.infoSecondaire} fr-mb-1w`}>
                      Source : Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tempor ultricies dictum. Suspendisse sit amet eros vel sem vulputate porta. Cras sed auctor justo, mollis consectetur urna.
                    </p>
                    <p className="fr-text--xs fr-mb-1v">
                      Ceci est la description de l’indicateur et des données associées. La pondération de l’indicateur dans le taux d’avancement global est également expliquée.
                    </p>
                    <Tableau<Indicateur & { territoire: string }>
                      afficherLaRecherche={false}
                      colonnes={colonnes}
                      données={
                          [{ ...indicateur, territoire: 'Nationnal' }]
                        }
                      entité='indicateur'
                    />
                  </CarteSquelette>
                </div>
              ))
          }
        </div>
      ))}
    </div>
  );
}
