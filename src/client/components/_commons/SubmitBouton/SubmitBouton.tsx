import '@gouvfr/dsfr/dist/component/button/button.min.css';

interface SubmitBoutonProps {
  label: string
  disabled?: boolean
  className?: string
}  

export default function SubmitBouton({ label, disabled, className }: SubmitBoutonProps) {
  return (
    <button
      className={`fr-btn${className ? ' ' + className : ''}`}
      disabled={disabled}
      type='submit'
    >
      {label}
    </button>
  );
}

SubmitBouton.defaultProps = {
  className: '',
  disabled: false,
};
