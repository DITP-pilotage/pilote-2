import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import FormulaireIndicateur from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier from '@/client/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

const étapes = ['Sélectionnez l’indicateur', 'Chargez votre fichier et vérifiez sa conformité']; 

export default function PageImportIndicateurSectionImport({
  indicateurs,
}: PageImportIndicateurSectionImportProps) {
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  const optionsSélecteur = indicateurs.map(elem => ({
    libellé: elem.nom,
    valeur: elem.id,
  }));

  enum Etapes {
    SELECTION_INDICATEUR = 1,
    IMPORT_FICHIER = 2,
  }
  
  const { query } = useRouter();
  const etapeCourante = (query.etapeCourante || 1) as number;
  const indicateur = indicateurs.find(indic => indic.id === query.indicateurId) as Indicateur;
  const chantierId = query.id as string;

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
          <div className={`${etapeCourante != Etapes.IMPORT_FICHIER && 'fr-hidden'}`}>
            <Titre baliseHtml='h4'>
              Vos données doivent être structurées pour être importées dans PILOTE
            </Titre>
            <p>
              Si vous avez déjà un fichier en votre possession, chargez votre fichier, nous vous indiquerons s’il est correctement formaté ou s’il doit être adapté.
            </p>
            <p>
              Ajouter un fichier pour l’indicateur              
              {' '}
              {indicateur?.nom}
            </p>
            <FormulaireIndicateur
              chantierId={chantierId}
              indicateurId={indicateur?.id}
              setRapport={setRapport}
            />
            {
              rapport !== null &&
                <ResultatValidationFichier rapport={rapport} />
            }
            <Link href={`/chantier/${chantierId}/indicateurs`}>
              Annuler
            </Link>
          </div>
        </Bloc>
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
