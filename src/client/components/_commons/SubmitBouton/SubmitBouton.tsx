import '@gouvfr/dsfr/dist/component/button/button.min.css';
import { FunctionComponent } from 'react';

interface SubmitBoutonProps {
  label: string
  disabled?: boolean
  className?: string
}  

const SubmitBouton: FunctionComponent<SubmitBoutonProps> = ({ label, disabled, className }) => {
  return (
    <button
      className={`fr-btn${className ? ' ' + className : ''}`}
      disabled={disabled}
      type='submit'
    >
      {label}
    </button>
  );
};

SubmitBouton.defaultProps = {
  className: '',
  disabled: false,
};

export default SubmitBouton;
