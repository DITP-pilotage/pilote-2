import { ChangeEventHandler } from 'react';
import '@gouvfr/dsfr/dist/component/upload/upload.min.css';

interface InputFichierProps {
  label: string
  onChange: ChangeEventHandler<HTMLInputElement>
} 

export default function InputFichier({ label, onChange }: InputFichierProps) {
  return (
    <div className="fr-upload-group">    
      <label
        className="fr-label"
        htmlFor="file-upload"
      >
        {label}
      </label>
      <input
        accept='.csv, .xls, .xlsx'
        className="fr-upload"
        id="file-upload"
        name="file-upload"
        onChange={onChange}
        type="file"
      />
    </div>
  );
}
