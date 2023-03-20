import { ChangeEventHandler, MouseEventHandler, useState } from 'react';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';

interface PageImportIndicateurProps {
  chantierId: string
}

export default function PageImportIndicateur({ chantierId }: PageImportIndicateurProps) {
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
    <div>
      <PageImportIndicateurEnTête chantierId={chantierId} />
      <div className="fr-upload-group">    
        <label
          className="fr-label"
          htmlFor="file-upload"
        >
          Importer des données
        </label>
        <input
          accept='.csv, .xls, .xlsx'
          className="fr-upload"
          id="file-upload"
          name="file-upload"
          onChange={définirLeFichier}
          type="file"
        />
      </div>
      <button
        className="fr-btn"
        onClick={uploadLeFichier}
        type='button'
      >
        Importer les données
      </button>
    </div>
  );
}
