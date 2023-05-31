import IndicateurBlocIndicateurTuileStyled
  from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBlocIndicateurTuile.styled';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IndicateurDétailsParTerritoireProps from './indicateurDétailsParTerritoire.interface';

export default function IndicateurBlocIndicateurTuile({ indicateurDétailsParTerritoire }: IndicateurDétailsParTerritoireProps) {
  return (
    <IndicateurBlocIndicateurTuileStyled>
      <table className='fr-p-0 fr-pb-2w'>
        <thead>
          <tr>
            <th className='fr-py-1v'>
              Territoire
            </th>
            <th className='fr-py-1v'>
              { indicateurDétailsParTerritoire.territoireNom }
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur initiale
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              { indicateurDétailsParTerritoire.données.valeurInitiale?.toLocaleString() }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur actuelle
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              { indicateurDétailsParTerritoire.données.valeurs.slice(-1)[0]?.toLocaleString() }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Cible 2026
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              { indicateurDétailsParTerritoire.données.valeurCible?.toLocaleString() }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Avancement 2026
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond='grisClair'
                positionTexte='côté'
                taille='md'
                valeur={indicateurDétailsParTerritoire.données.avancement.global}
                variante='primaire'
              />
            </td>
          </tr>
        </tbody>
      </table>
    </IndicateurBlocIndicateurTuileStyled>
  );
}
