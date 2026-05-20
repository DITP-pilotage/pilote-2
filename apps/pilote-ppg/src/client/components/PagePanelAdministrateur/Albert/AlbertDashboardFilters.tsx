import { FormEvent, useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { clsxm } from "@/utils/clsxm";

export type FiltresDashboard = {
  recherche: string;
  avecPouce: boolean;
  avecPouceBas: boolean;
  avecCommentaire: boolean;
  profilCodes: string[];
};

export const FILTRES_VIDES: FiltresDashboard = {
  recherche: "",
  avecPouce: false,
  avecPouceBas: false,
  avecCommentaire: false,
  profilCodes: [],
};

type AlbertDashboardFiltersProps = {
  filtres: FiltresDashboard;
  onChange: (filtres: FiltresDashboard) => void;
};

export const AlbertDashboardFilters = ({
  filtres,
  onChange,
}: AlbertDashboardFiltersProps) => {
  const [rechercheLocale, setRechercheLocale] = useState(filtres.recherche);
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined);

  const validerRecherche = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ ...filtres, recherche: rechercheLocale.trim() });
  };

  const toggleBooleen = (
    champ: "avecPouce" | "avecPouceBas" | "avecCommentaire",
  ) => {
    onChange({ ...filtres, [champ]: !filtres[champ] });
  };

  const reinitialiser = () => {
    setRechercheLocale("");
    onChange(FILTRES_VIDES);
  };

  const toggleProfil = (code: string) => {
    const actuel = filtres.profilCodes;
    const suivant = actuel.includes(code)
      ? actuel.filter((c) => c !== code)
      : [...actuel, code];
    onChange({ ...filtres, profilCodes: suivant });
  };

  return (
    <div className="!mb-4 flex flex-wrap items-center gap-3">
      <form className="flex items-center gap-2" onSubmit={validerRecherche}>
        <input
          className="!border !border-gray-300 !rounded-md !px-3 !py-2 !text-sm !w-72"
          onChange={(event) => setRechercheLocale(event.target.value)}
          placeholder="Rechercher dans le titre ou le 1er message"
          type="search"
          value={rechercheLocale}
        />
        <button
          className="!px-3 !py-2 !text-sm !rounded-md !bg-dsfr-blue-france-sun-113 !text-white"
          type="submit"
        >
          Rechercher
        </button>
      </form>

      {[
        { champ: "avecPouce" as const, label: "👍" },
        { champ: "avecPouceBas" as const, label: "👎" },
        { champ: "avecCommentaire" as const, label: "💬" },
      ].map(({ champ, label }) => (
        <button
          aria-pressed={filtres[champ]}
          className={clsxm(
            "!px-3 !py-2 !text-sm !rounded-md !border",
            filtres[champ]
              ? "!bg-dsfr-blue-france-sun-113 !text-white !border-dsfr-blue-france-sun-113"
              : "!bg-white !text-gray-700 !border-gray-300",
          )}
          key={champ}
          onClick={() => toggleBooleen(champ)}
          type="button"
        >
          {label}
        </button>
      ))}

      {profils && profils.length > 0 && (
        <details className="!relative">
          <summary className="!cursor-pointer !px-3 !py-2 !text-sm !rounded-md !border !border-gray-300 !list-none">
            Profils{" "}
            {filtres.profilCodes.length > 0 &&
              `(${filtres.profilCodes.length})`}
          </summary>
          <div className="!absolute !z-10 !mt-1 !p-3 !bg-white !border !border-gray-200 !rounded-md !shadow-md !max-h-72 !overflow-y-auto !w-64">
            {profils.map((profil) => (
              <label
                className="!flex !items-center !gap-2 !text-sm !py-1"
                key={profil.code}
              >
                <input
                  checked={filtres.profilCodes.includes(profil.code)}
                  onChange={() => toggleProfil(profil.code)}
                  type="checkbox"
                />
                {profil.nom}
              </label>
            ))}
          </div>
        </details>
      )}

      <button
        className="!px-3 !py-2 !text-sm !rounded-md !text-gray-700 !underline"
        onClick={reinitialiser}
        type="button"
      >
        Réinitialiser
      </button>
    </div>
  );
};
