import '@gouvfr/dsfr/dist/component/select/select.min.css';
import { libellésMailles, Maille, mailles } from '@/server/domain/chantier/Chantier.interface';
import SélecteurDeMailleProps from './SélecteurDeMaille.interface';

export default function SélecteurDeMaille({
  setMaille,
  maille,
  libellé = 'Maille administrative',
}: SélecteurDeMailleProps) {
  return (
    <div className="fr-select-group">
      <label
        className="fr-label"
        htmlFor="maille"
      >
        { libellé }
      </label>
      <select
        className="fr-select"
        name="maille"
        onChange={(événement) => {
          const mailleSélectionnée = événement.currentTarget.value;
          if (mailles.includes(mailleSélectionnée as any)) {
            setMaille(mailleSélectionnée as Maille);
          }
        }}
        value={maille}
      >
        <option
          disabled
          hidden
          value=""
        >
          Selectionnez une maille
        </option>
        {
          mailles.map(mailleÉlément => (
            <option
              key={mailleÉlément}
              value={mailleÉlément}
            >
              { libellésMailles[mailleÉlément] }
            </option>
          ))
        }
      </select>
    </div>
  );
}
