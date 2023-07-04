import IndicateurBlocIndicateurTuileStyled
  from '@/components/_commons/Indicateurs/Bloc/IndicateurBlocIndicateurTuile.styled';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurDétailsParTerritoireProps from './indicateurDétailsParTerritoire.interface';

export default function IndicateurBlocIndicateurTuile({ indicateurDétailsParTerritoire, typeDeRéforme }: IndicateurDétailsParTerritoireProps) {
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                { indicateurDétailsParTerritoire.données.valeurInitiale?.toLocaleString() }
              </span>
              <span className='texte-gris'>
                (
                { formaterDate(indicateurDétailsParTerritoire.données.dateValeurInitiale, 'MM/YYYY') }
                )
              </span>
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur actuelle
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                { indicateurDétailsParTerritoire.données.valeurs.slice(-1)[0]?.toLocaleString() }
              </span>
              <span className='texte-gris'>
                (
                { formaterDate(indicateurDétailsParTerritoire.données.dateValeurs[indicateurDétailsParTerritoire.données.dateValeurs.length - 1], 'MM/YYYY') }
                )
              </span>
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === 'chantier' ? 'Cible 2026' : 'Cible'}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              { indicateurDétailsParTerritoire.données.valeurCible?.toLocaleString() }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === 'chantier' ? 'Avancement 2026' : 'Avancement'}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond='grisClair'
                positionTexte='côté'
                taille='md'
                valeur={indicateurDétailsParTerritoire.données.avancement.global}
                variante={typeDeRéforme === 'chantier' ? 'primaire' : 'rose'}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </IndicateurBlocIndicateurTuileStyled>
  );
}
