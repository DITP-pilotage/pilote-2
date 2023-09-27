import IndicateurBlocIndicateurTuileStyled
  from '@/components/_commons/Indicateurs/Bloc/IndicateurBlocIndicateurTuile.styled';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurDétailsParTerritoireProps from './indicateurDétailsParTerritoire.interface';

export default function IndicateurBlocIndicateurTuile({ indicateurDétailsParTerritoire, typeDeRéforme, unité }: IndicateurDétailsParTerritoireProps) {
  const { dateValeurInitiale, valeurInitiale, valeurActuelle, valeurCible, dateValeurCible, dateValeurActuelle, avancement, dateValeurCibleAnnuelle, valeurCibleAnnuelle } = indicateurDétailsParTerritoire.données;
  const unitéAffichée = unité?.toLocaleLowerCase() === 'pourcentage' ? ' %' : '';
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
                { valeurInitiale?.toLocaleString() + unitéAffichée }
              </span>
              {
                dateValeurInitiale !== null &&
                <span className='texte-gris'>
                  (
                  { formaterDate(dateValeurInitiale, 'MM/YYYY') }
                  )
                </span>
              }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur actuelle
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                { valeurActuelle?.toLocaleString() + unitéAffichée }
              </span>
              {
                dateValeurActuelle !== null &&
                <span className='texte-gris'>
                  (
                  { formaterDate(dateValeurActuelle, 'MM/YYYY') }
                  )
                </span>
              }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === 'chantier' ? 'Cible ' + new Date().getFullYear().toString() : 'Cible'}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                { valeurCibleAnnuelle?.toLocaleString() + unitéAffichée }
              </span>
              {
                dateValeurCible !== null &&
                <span className='texte-gris'>
                  (
                  { formaterDate(dateValeurCibleAnnuelle, 'MM/YYYY') }
                  )
                </span>
              }
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === 'chantier' ? 'Avancement ' + new Date().getFullYear().toString() : 'Avancement'}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond='grisClair'
                positionTexte='côté'
                taille='md'
                valeur={avancement.annuel}
                variante={typeDeRéforme === 'chantier' ? 'secondaire' : 'rose'}
              />
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === 'chantier' ? 'Cible 2026' : 'Cible'}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                { valeurCible?.toLocaleString() + unitéAffichée }
              </span>
              {
                dateValeurCible !== null &&
                <span className='texte-gris'>
                  (
                  { formaterDate(dateValeurCible, 'MM/YYYY') }
                  )
                </span>
              }
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
                valeur={avancement.global}
                variante={typeDeRéforme === 'chantier' ? 'primaire' : 'rose'}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </IndicateurBlocIndicateurTuileStyled>
  );
}
