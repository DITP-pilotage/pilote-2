import { ChangeEventHandler } from 'react';
import '@gouvfr/dsfr/dist/component/upload/upload.min.css';

interface InputFichierProps {
  onChange: ChangeEventHandler<HTMLInputElement>
} 

export default function InputFichier({ onChange }: InputFichierProps) {
  return (
    <div className='fr-upload-group'>
      <input
        accept='.csv, .xls, .xlsx'
        className='fr-upload'
        id='file-upload'
        name='file-upload'
        onChange={onChange}
        type='file'
      />
    </div>
  );
}
