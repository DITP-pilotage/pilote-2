import { useRouter } from 'next/router';
import { useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/client/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import FormulairePublierImportIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireImportIndicateur/FormulairePublierImportIndicateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import { wording } from '@/client/utils/i18n/i18n';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

const étapes = [
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.SOUS_TITRE_SELECTEUR,
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.SOUS_TITRE_SELECTEUR,
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.SOUS_TITRE_SELECTEUR,
];

export default function PageImportIndicateurSectionImport({
  indicateurs,
  rapport: rapportImport,
}: PageImportIndicateurSectionImportProps) {
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);
  const [estFichierPublie, setEstFichierPublie] = useState<boolean>(false);


  const optionsSélecteur = indicateurs.map(elem => ({
    libellé: elem.nom,
    valeur: elem.id,
  }));

  enum Etapes {
    SELECTION_INDICATEUR = 1,
    VERIFIER_FICHIER = 2,
    IMPORT_FICHIER = 3,
  }

  const { query } = useRouter();
  const etapeCourante = (query.etapeCourante || 1) as number;
  const indicateur = indicateurs.find(indic => indic.id === query.indicateurId) as Indicateur;
  const chantierId = query.id as string;
  const indicateurId = query.indicateurId as string;
  const rapportId = query.rapportId as string;
  const [indicateurSelectionné, setIndicateurSelectionné] = useState<string>(optionsSélecteur[0]?.valeur || '');

  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.TITRE}
        </Titre>
        <Bloc>
          <IndicateurDEtapes
            étapeCourante={etapeCourante}
            étapes={étapes}
          />
          {
            optionsSélecteur.length > 0 ?
              <form
                className={`${etapeCourante != Etapes.SELECTION_INDICATEUR && 'fr-hidden'}`}
                method='GET'
              >
                <Titre baliseHtml='h4'>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.TITRE}
                </Titre>
                <input
                  name='etapeCourante'
                  type="hidden"
                  value={2}
                />
                <Sélecteur
                  htmlName="indicateurId"
                  libellé='Choix de l’indicateur'
                  options={optionsSélecteur}
                  valeurModifiéeCallback={setIndicateurSelectionné}
                  valeurSélectionnée={indicateurSelectionné}
                />
                <div className='fr-mt-4w flex justify-end'>
                  <SubmitBouton
                    className='fr-btn--icon-right fr-icon-arrow-right-line'
                    label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.LABEL_BOUTON_PROCHAINE_ETAPE}
                  />
                </div>
              </form>
              :
              <div>
                { wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.MESSAGE_ERREUR_AUCUN_INDICATEUR }
              </div>
          }
          <div
            className={`${etapeCourante != Etapes.VERIFIER_FICHIER && 'fr-hidden'}`}
          >
            <Titre baliseHtml='h4'>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE}
            </Titre>
            <p>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.SOUS_TITRE}
            </p>
            <p>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.LABEL_BOUTON_CHARGER_FICHIER(indicateur?.nom)}
            </p>
            <FormulaireIndicateur
              chantierId={chantierId}
              indicateurId={indicateurId}
              setRapport={setRapport}
            />
            {
              rapport !== null &&
                <ResultatValidationFichier rapport={rapport} />
            }
            {
              rapport?.estValide ?
                <div className='fr-mt-4w'>
                  <form method="GET">
                    <input
                      name='etapeCourante'
                      type="hidden"
                      value={3}
                    />
                    <input
                      name='indicateurId'
                      type="hidden"
                      value={indicateur?.id}
                    />
                    <input
                      name='rapportId'
                      type="hidden"
                      value={rapport?.id}
                    />
                    <div className='fr-mt-4w flex justify-end'>
                      <SubmitBouton
                        className='fr-btn--icon-right fr-icon-arrow-right-line'
                        label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE}
                      />
                    </div>
                  </form>
                </div>
                : null
            }
          </div>
          <div className={`${etapeCourante != Etapes.IMPORT_FICHIER && 'fr-hidden'}`}>
            {
              estFichierPublie ?
                <div className="fr-mt-4w">
                  <Alerte
                    message={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.MESSAGE_ALERT_SUCCES}
                    titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE_ALERT_SUCCES(indicateurId)}
                    type='succès'
                  />
                </div>
                :
                <div>
                  {rapportImport?.listeMesuresIndicateurTemporaire.length ?
                    <>
                      <table className='fr-table fr-mb-3w fr-p-0 '>
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
        </Bloc>
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
