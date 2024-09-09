import { FunctionComponent, InputHTMLAttributes } from 'react';
import '@gouvfr/dsfr/dist/component/upload/upload.min.css';

type InputFichierProps = InputHTMLAttributes<HTMLInputElement>;

const InputFichier: FunctionComponent<InputFichierProps> = ({ onChange, accept = '.csv, .xls, .xlsx' }) => {
  return (
    <div className='fr-upload-group'>
      <input
        accept={accept}
        aria-label='Choisir un fichier'
        className='fr-upload'
        id='file-upload'
        name='file-upload'
        onChange={onChange}
        type='file'
      />
    </div>
  );
};

export default InputFichier;
