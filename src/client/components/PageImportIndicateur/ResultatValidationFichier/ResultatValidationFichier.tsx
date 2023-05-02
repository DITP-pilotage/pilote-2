import { useRouter } from 'next/router';
import Alerte from '@/components/_commons/Alerte/Alerte';
import { ResultatValidationFichierProps } from './ResultatValidationFichier.interface';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
export default function ResultatValidationFichier({ rapport }: ResultatValidationFichierProps) {
  const { query } = useRouter();
  const { indicateurId } = query;

  return (
    <section>
      {
      rapport.estValide
        ?
          <Alerte
            message='La mise à jour des taux d’avancement sera effective dans un durée maximale de 24h. Vous pouvez, en attendant, mettre à jour d’autres indicateurs.'
            titre={`Les données ont été importées avec succès pour l’indicateur ${indicateurId}`}
            type='succès'
          />
        :
          <div className='fr-py-4w'>
            <Alerte
              message='Nous vous invitons à confirmer que les potentielles anomalies détaillées ci-dessous ne sont pas des erreurs avant de passer à l’étape suivante.'
              titre='Votre fichier est conforme mais il comporte de potentielles anomalies'
              type='erreur'
            />
            <h5>
              Rapport d&apos;erreur de la validation du fichier
            </h5>
            <table className='fr-table fr-m-0 fr-p-0'>
              <thead>
                <tr>
                  <th>
                    Nom
                  </th>
                  <th>
                    Cellule
                  </th>
                  <th>
                    Message
                  </th>
                  <th>
                    Nom du champ
                  </th>
                  <th>
                    Numéro de ligne
                  </th>
                  <th>
                    Position de ligne
                  </th>
                  <th>
                    Position du champ
                  </th>
                </tr>
              </thead>
              <tbody>
                {
            rapport.listeErreursValidation.map(erreur => {
              return (
                <tr key={`${erreur.cellule}-${erreur.numeroDeLigne}-${erreur.positionDeLigne}`}>
                  <td>
                    {erreur.nom}
                  </td>
                  <td>
                    {erreur.cellule}
                  </td>
                  <td>
                    {erreur.message}
                  </td>
                  <td>
                    {erreur.nomDuChamp}
                  </td>
                  <td>
                    {erreur.numeroDeLigne}
                  </td>
                  <td>
                    {erreur.positionDeLigne}
                  </td>
                  <td>
                    {erreur.positionDuChamp}
                  </td>
                </tr>
              );
            })
            }
              </tbody>
            </table>
          </div>
      }
    </section>
  );
}
