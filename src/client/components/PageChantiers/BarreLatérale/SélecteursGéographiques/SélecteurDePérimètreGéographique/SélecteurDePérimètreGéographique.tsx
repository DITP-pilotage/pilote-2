import { useEffect } from 'react';
import {
  périmètreGéographique as périmètreGéographiqueStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import SélecteurDePérimètreGéographiqueProps, {
} from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
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

export default function SélecteurDePérimètreGéographique({ niveauDeMaille }: SélecteurDePérimètreGéographiqueProps) {
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();

  useEffect(() => {
    setPérimètreGéographique({
      codeInsee: 'FR',
      maille: 'nationale',
    });
  }, [niveauDeMaille]);

  return (
    <div className="fr-select-group fr-mt-5v">
      <label
        className="fr-label"
        htmlFor="select"
      >
        Périmètre géographique
      </label>
      <select
        className="fr-select"
        id="perimetre-géographique"
        name="select"
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
