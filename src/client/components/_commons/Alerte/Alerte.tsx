import AlerteProps from './Alerte.interface';

export default function Alerte({ type, message }: AlerteProps) {
  return (
    <div className={`${type === 'succès' ? 'fr-alert--success' : 'fr-alert--error'} fr-alert  fr-mb-2w`}>
      <p className="fr-alert__title">
        {message}
      </p>
    </div>
  );
}
