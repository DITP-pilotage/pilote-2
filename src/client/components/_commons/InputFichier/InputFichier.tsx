import { InputHTMLAttributes } from 'react';
import '@gouvfr/dsfr/dist/component/upload/upload.min.css';

type InputFichierProps = InputHTMLAttributes<HTMLInputElement>;

export default function InputFichier({ onChange, accept = '.csv, .xls, .xlsx' }: InputFichierProps) {
  return (
    <div className='fr-upload-group'>
      <input
        accept={accept}
        className='fr-upload'
        id='file-upload'
        name='file-upload'
        onChange={onChange}
        type='file'
      />
    </div>
  );
}
