import {
  périmètreGéographique as périmètreGéographiqueStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useNiveauDeMailleStore/useNiveauDeMailleStore';
import {
  PérimètreGéographique,
} from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';

const périmètresGéographiques: Record<string, PérimètreGéographique> = {
  FR: {
    codeInsee: 'FR',
    nom: 'France',
    maille: 'nationale',
  },
  '01': {
    codeInsee: '01',
    nom: 'Ain',
    // eslint-disable-next-line sonarjs/no-duplicate-string
    maille: 'départementale',
  },
  '02': {
    codeInsee: '02',
    nom: 'Aisne',
    maille: 'départementale',
  },
};

export default function SélecteurDePérimètreGéographique() {
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();

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
            maille: périmètresGéographiques[codeInsee].maille,
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
        {
          Object.values(périmètresGéographiques).map(pg => (
            <option
              key={`${pg.maille}-${pg.codeInsee}`}
              value={pg.codeInsee}
            >
              { `${pg.codeInsee} – ${pg.nom}` }
            </option>
          ))
        }
      </select>
    </div>
  );
}
