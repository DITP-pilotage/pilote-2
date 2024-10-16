import { FunctionComponent } from 'react';
import { wording } from '@/client/utils/i18n/i18n';
import Alerte from '@/components/_commons/Alerte/Alerte';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

interface ResultatValidationFichierProps {
  rapport: DetailValidationFichierContrat
}

const ResultatValidationFichier: FunctionComponent<ResultatValidationFichierProps> = ({ rapport }) => {
  const contientDesErreursNonIdentifies = rapport.listeErreursValidation.some(erreur => erreur.nom === 'Erreur non identifié');

  return (
    <section className='fr-my-2w'>
      {
        rapport.estValide
          ?
            <Alerte
              message={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_SUCCES}
              titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE_ALERT_SUCCES}
              type='succès'
            />
          :
            <div>
              {
                contientDesErreursNonIdentifies ? (
                  <Alerte
                    message={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR_SUPPORT}
                    titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR_SUPPORT}
                    type='erreur'
                  />
                ) : (
                  <Alerte
                    message={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR}
                    titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR}
                    type='erreur'
                  />
                )
              }
              <h5 className='fr-mt-3w'>
                Rapport d'erreur de la validation du fichier
              </h5>
              <table className='fr-table fr-m-0 fr-p-0'>
                <thead>
                  <tr>
                    <th>
                      {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM}
                    </th>
                    <th>
                      {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.CELLULE}
                    </th>
                    <th>
                      {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.MESSAGE}
                    </th>
                    <th>
                      {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM_DU_CHAMP}
                    </th>
                    <th>
                      {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.POSITION_DE_LIGNE}
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
                        {erreur.positionDeLigne}
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
};

export default ResultatValidationFichier;
