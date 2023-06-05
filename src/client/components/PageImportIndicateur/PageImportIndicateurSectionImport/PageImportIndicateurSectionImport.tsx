import { useRouter } from 'next/router';
import { useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/client/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import FormulairePublierImportIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireImportIndicateur/FormulairePublierImportIndicateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

const étapes = ['Sélectionnez l’indicateur', 'Chargez votre fichier et vérifiez sa conformité', 'Vérifiez les valeurs saisies avant de publier vos données'];

export default function PageImportIndicateurSectionImport({
  indicateurs,
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

  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          Importez vos données
        </Titre>
        <Bloc>
          <IndicateurDEtapes
            étapeCourante={etapeCourante}
            étapes={étapes}
          />
          <form
            className={`${etapeCourante != Etapes.SELECTION_INDICATEUR && 'fr-hidden'}`}
            method='GET'
          >
            <Titre baliseHtml='h4'>
              Pour quel indicateur souhaitez vous mettre à jour les données ?
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
            />
            <div className='fr-mt-4w'>
              <SubmitBouton label="Suivant" />
            </div>
          </form>
          <div
            className={`${etapeCourante != Etapes.VERIFIER_FICHIER && 'fr-hidden'}`}
          >
            <Titre baliseHtml='h4'>
              Vos données doivent être structurées pour être importées dans PILOTE
            </Titre>
            <p>
              Si vous avez déjà un fichier en votre possession, chargez votre fichier, nous vous indiquerons s’il est
              correctement formaté ou s’il doit être adapté.
            </p>
            <p>
              Ajouter un fichier pour l’indicateur
              {' '}
              {indicateur?.nom}
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
                    <SubmitBouton label="Suivant" />
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
                    message='La mise à jour des taux d’avancement sera effective dans une durée maximale de 24h. Vous pouvez, en attendant, mettre à jour d’autres indicateurs.'
                    titre={`Les données ont été importées avec succès pour l’indicateur ${indicateurId}`}
                    type='succès'
                  />
                </div>
                : <FormulairePublierImportIndicateur
                    chantierId={chantierId}
                    indicateurId={indicateurId}
                    rapportId={rapportId}
                    setEstFichierPublie={setEstFichierPublie}
                  />
            }
          </div>
        </Bloc>
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
