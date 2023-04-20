import '@gouvfr/dsfr/dist/component/button/button.min.css';

interface SubmitBoutonProps {
  label: string
  disabled: boolean
}  

export default function SubmitBouton({ label, disabled = false }: SubmitBoutonProps) {
  return (
    <button
      className="fr-btn"
      disabled={disabled}
      type="submit"
    >
      {label}
    </button>
  );
}
