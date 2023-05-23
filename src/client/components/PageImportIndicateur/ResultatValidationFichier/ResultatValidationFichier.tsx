import Alerte from '@/components/_commons/Alerte/Alerte';
import { ResultatValidationFichierProps } from './ResultatValidationFichier.interface';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
export default function ResultatValidationFichier({ rapport }: ResultatValidationFichierProps) {
  return (
    <section className='fr-my-2w'>
      {
      rapport.estValide
        ?
          <Alerte
            message='Passez à l’étape suivante pour prévisualiser les données et confirmer leur publication.'
            titre="Bravo, le fichier est conforme !"
            type='succès'
          />
        :
          <div className='fr-py-4w'>
            <Alerte
              message='Il contient des erreurs expliquées dans le rapport d’erreurs ci-dessous. Nous vous recommandons de consulter les ressources et/ou de remplir le modèle de fichier à remplir.'
              titre='Le fichier ne peut pas être importé'
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
