import '@gouvfr/dsfr/dist/component/select/select.min.css';
import { useEffect } from 'react';
import SélecteurDePérimètreGéographiqueProps from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import départements from '@/client/constants/départements';
import régions from '@/client/constants/régions';

// TODO supprimer et faire passer en serverSideProps
const périmètresGéographiques = {
  régionale: [
    ...régions,
  ],
  départementale: [
    ...départements,
  ],
};

export default function SélecteurDePérimètreGéographique({
  niveauDeMaille,
  périmètreGéographique,
  setPérimètreGéographique,
  libellé = 'Périmètre géographique',
}: SélecteurDePérimètreGéographiqueProps) {

  useEffect(() => {
    setPérimètreGéographique({
      codeInsee: 'FR',
      maille: 'nationale',
    });
  }, [niveauDeMaille, setPérimètreGéographique]);

  return (
    <div className="fr-select-group">
      <label
        className="fr-label"
        htmlFor="périmètre-géographique"
      >
        { libellé }
      </label>
      <select
        className="fr-select"
        name="périmètre-géographique"
        onChange={(événement) => {
          const codeInsee = événement.currentTarget.value;
          setPérimètreGéographique({
            codeInsee: codeInsee,
            maille: codeInsee === 'FR' ? 'nationale' : niveauDeMaille,
          });
        }}
        value={périmètreGéographique.codeInsee}
      >
        <option
          disabled
          hidden
          value=""
        >
          Selectionnez un territoire
        </option>
        <option value="FR">
          France
        </option>
        {
          périmètresGéographiques[niveauDeMaille].map(pg => (
            <option
              key={pg.codeInsee}
              value={pg.codeInsee}
            >
              {
                niveauDeMaille === 'départementale'
                  ? `${pg.codeInsee} – ${pg.nom}`
                  : pg.nom
              }
            </option>
          ))
        }
      </select>
    </div>
  );
}
