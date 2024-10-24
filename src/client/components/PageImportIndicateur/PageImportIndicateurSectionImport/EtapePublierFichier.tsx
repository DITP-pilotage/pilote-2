import { Dispatch, FunctionComponent, SetStateAction } from 'react';
import Link from 'next/link';
import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import Alerte from '@/components/_commons/Alerte/Alerte';
import { wording } from '@/client/utils/i18n/i18n';
import FormulairePublierImportIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireImportIndicateur/FormulairePublierImportIndicateur';

const EtapePublierFichier: FunctionComponent<{
  estFichierPublie: boolean,
  indicateurId: string,
  chantierId: string,
  rapportId: string,
  setEstFichierPublie: Dispatch<SetStateAction<boolean>>,
  rapportImport: RapportContrat | null
}> = ({
  estFichierPublie,
  indicateurId,
  chantierId,
  rapportId,
  setEstFichierPublie,
  rapportImport,
}) => {
  return (
    <div>
      {
        estFichierPublie ?
          <div className='fr-mt-4w'>
            <Alerte
              message={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.MESSAGE_ALERT_SUCCES}
              titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE_ALERT_SUCCES(indicateurId)}
              type='succès'
            />
            <div className='fr-mt-3w flex justify-end'>
              <Link
                className='fr-btn'
                href={`/chantier/${chantierId}/indicateurs`}
                title='Importer de nouvelles données'
              >
                <span>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.MESSAGE_BOUTON_RETOUR}
                </span>
              </Link>
            </div>
          </div>
          :
          <div>
            {rapportImport?.listeMesuresIndicateurTemporaire.length ?
              <>
                <FormulairePublierImportIndicateur
                  chantierId={chantierId}
                  indicateurId={indicateurId}
                  rapportId={rapportId}
                  setEstFichierPublie={setEstFichierPublie}
                />
                <table className='fr-table fr-my-3w fr-p-0'>
                  <thead>
                    <tr>
                      <th>
                        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE.IDENTIFIANT_INDIC}
                      </th>
                      <th>
                        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE.ZONE_ID}
                      </th>
                      <th>
                        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE.DATE_VALEUR}
                      </th>
                      <th>
                        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE.TYPE_VALEUR}
                      </th>
                      <th>
                        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE.VALEUR}

                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapportImport?.listeMesuresIndicateurTemporaire.map(mesureIndicateurTemporaire => {
                      return (
                        <tr key={`${mesureIndicateurTemporaire.metricType}-${mesureIndicateurTemporaire.zoneId}`}>
                          <td>
                            {mesureIndicateurTemporaire.indicId}
                          </td>
                          <td>
                            {mesureIndicateurTemporaire.zoneId}
                          </td>
                          <td>
                            {mesureIndicateurTemporaire.metricDate}
                          </td>
                          <td>
                            {mesureIndicateurTemporaire.metricType}
                          </td>
                          <td>
                            {mesureIndicateurTemporaire.metricValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <FormulairePublierImportIndicateur
                  chantierId={chantierId}
                  indicateurId={indicateurId}
                  rapportId={rapportId}
                  setEstFichierPublie={setEstFichierPublie}
                />
              </>
              :
              <Alerte
                titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE_ALERT_ERREUR}
                type='erreur'
              />}
          </div>
      }

    </div>
  );
};

export default EtapePublierFichier;
