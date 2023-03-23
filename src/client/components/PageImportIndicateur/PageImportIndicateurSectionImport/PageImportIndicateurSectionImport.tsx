import { useState, ChangeEventHandler, MouseEventHandler } from 'react';
import Bouton from '@/components/_commons/Bouton/Bouton';
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Indicateurs from '@/components/PageChantier/Indicateurs/Indicateurs';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';

interface PageImportIndicateurSectionImportProps {
  chantierId: string
  détailsIndicateurs: DétailsIndicateurs | null
  indicateurs: Indicateur[]
}

export default function PageImportIndicateurSectionImport({ chantierId, détailsIndicateurs, indicateurs }:PageImportIndicateurSectionImportProps) {
  const [file, setFile] = useState<File | null>(null);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {      
      setFile(event.target.files[0]);
    }
  };
  
  const uploadLeFichier: MouseEventHandler<HTMLButtonElement> = async () => {
    if (!file) {
      return;
    }
  
    const body = new FormData();
    body.append('file', file);
  
    await fetch(`/api/chantier/${chantierId}/indicateur/indicateurIdToBeDefined`, {
      method: 'POST',
      body,
    });
  };

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
          <div className='fr-grid-row fr-grid-row--middle fr-grid-row--center fr-gap-2w'>
            <InputFichier
              label='Importer des données'
              onChange={définirLeFichier}
            />
            <Bouton
              label='Importer les données'
              onClick={uploadLeFichier}
            />
          </div>
        </Bloc>
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
