import { FormEvent, useState } from "react";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { FEEDBACK_CATEGORIES } from "@/components/_commons/ChatUI/feedbackCategories";
import { clsxm } from "@/utils/clsxm";

export type FiltresDashboard = {
  recherche: string;
  avecPouce: boolean;
  avecPouceBas: boolean;
  avecCommentaire: boolean;
  categories: $Enums.llm_call_categorie_probleme[];
  profilCodes: string[];
};

export const FILTRES_VIDES: FiltresDashboard = {
  recherche: "",
  avecPouce: false,
  avecPouceBas: false,
  avecCommentaire: false,
  categories: [],
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
      ? actuel.filter((profilCode) => profilCode !== code)
      : [...actuel, code];
    onChange({ ...filtres, profilCodes: suivant });
  };

  const toggleCategorie = (valeur: $Enums.llm_call_categorie_probleme) => {
    const actuelles = filtres.categories;
    const suivantes = actuelles.includes(valeur)
      ? actuelles.filter((categorie) => categorie !== valeur)
      : [...actuelles, valeur];
    onChange({ ...filtres, categories: suivantes });
  };

  return (
    <div className="!mb-4 flex flex-wrap items-center gap-3">
      <form className="flex items-center gap-2" onSubmit={validerRecherche}>
        <input
          className="!border !border-dsfr-grey-900 !rounded-md !px-3 !py-2 !text-sm !w-72"
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
              : "!bg-white !text-dsfr-grey-200 !border-dsfr-grey-900",
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
          <summary className="!cursor-pointer !px-3 !py-2 !text-sm !rounded-md !border !border-dsfr-grey-900 !list-none">
            Profils{" "}
            {filtres.profilCodes.length > 0 &&
              `(${filtres.profilCodes.length})`}
          </summary>
          <div className="!absolute !z-10 !mt-1 !p-3 !bg-white !border !border-dsfr-grey-925 !rounded-md !shadow-md !max-h-72 !overflow-y-auto !w-64">
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

      <details className="!relative">
        <summary className="!cursor-pointer !px-3 !py-2 !text-sm !rounded-md !border !border-dsfr-grey-900 !list-none">
          Catégories{" "}
          {filtres.categories.length > 0 && `(${filtres.categories.length})`}
        </summary>
        <div className="!absolute !z-10 !mt-1 !p-3 !bg-white !border !border-dsfr-grey-925 !rounded-md !shadow-md !w-64">
          {FEEDBACK_CATEGORIES.map((categorie) => (
            <label
              className="!flex !items-center !gap-2 !text-sm !py-1"
              key={categorie.valeur}
            >
              <input
                checked={filtres.categories.includes(categorie.valeur)}
                onChange={() => toggleCategorie(categorie.valeur)}
                type="checkbox"
              />
              {categorie.titre}
            </label>
          ))}
        </div>
      </details>

      <button
        className="!px-3 !py-2 !text-sm !rounded-md !text-dsfr-grey-200 !underline"
        onClick={reinitialiser}
        type="button"
      >
        Réinitialiser
      </button>
    </div>
  );
};
