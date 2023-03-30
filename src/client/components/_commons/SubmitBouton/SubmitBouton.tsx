import '@gouvfr/dsfr/dist/component/button/button.min.css';

interface SubmitBoutonProps {
  label: string
}  

export default function SubmitBouton({ label }: SubmitBoutonProps) {
  return (
    <button
      className="fr-btn"
      type="submit"
    >
      {label}
    </button>
  );
}
