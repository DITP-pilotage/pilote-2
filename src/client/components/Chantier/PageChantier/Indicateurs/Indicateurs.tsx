import { createColumnHelper } from '@tanstack/react-table';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/Chantier/PageChantier/Indicateurs/Indicateurs.interface';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

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
            apparence='fr-h4'
            baliseHtml='h3'
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
                      apparence="fr-h5"
                      baliseHtml="h4"
                    >
                      { indicateur.nom }
                    </Titre>
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
