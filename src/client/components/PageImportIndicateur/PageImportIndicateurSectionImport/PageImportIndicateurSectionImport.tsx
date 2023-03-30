import { useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Indicateurs from '@/components/PageChantier/Indicateurs/Indicateurs';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import ResultatValidationFichier from '@/client/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import FormulaireIndicateur from './FormulaireIndicateur/FormulaireIndicateur';

interface PageImportIndicateurSectionImportProps {
  chantierId: string
  détailsIndicateurs: DétailsIndicateurs | null
  indicateurs: Indicateur[]
}

export default function PageImportIndicateurSectionImport({ chantierId, détailsIndicateurs, indicateurs }: PageImportIndicateurSectionImportProps) {
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          Indicateurs
        </Titre>
        <Titre baliseHtml='h3'>
          Indicateurs d&apos;impact
        </Titre>
        <Bloc>
          <span className='fr-h4'>
            Titre de l&apos;indicateur
          </span>
          <FormulaireIndicateur
            chantierId={chantierId}
            setRapport={setRapport}
          />
        </Bloc>
        {
        rapport !== null &&
        <Bloc>
          <ResultatValidationFichier rapport={rapport} />
        </Bloc>
        }
        {
          détailsIndicateurs !== null && (
            <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
              <div className="fr-col-12">
                <Indicateurs
                  détailsIndicateurs={détailsIndicateurs}
                  indicateurs={indicateurs}
                />
              </div>
            </div>
          )
        }
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
