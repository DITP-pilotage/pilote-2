import AlerteProps from './Alerte.interface';

export default function Alerte({ type, message }: AlerteProps) {
  return (
    <div className={`${type === 'succès' ? 'fr-alert--success' : 'fr-alert--error'} fr-alert`}>
      <p className="fr-alert__title">
        {message}
      </p>
    </div>
  );
}
