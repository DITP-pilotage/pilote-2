import { $Enums } from "@prisma/client";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { SegmentedControl } from "@/components/shared/SegmentedControl";

const OPTIONS_MAILLE = [
  { valeur: "TOUTES", libelle: "Toutes" },
  { valeur: $Enums.Maille.NAT, libelle: "Nationale" },
  { valeur: $Enums.Maille.REG, libelle: "Régionale" },
  { valeur: $Enums.Maille.DEPT, libelle: "Départementale" },
] as const;

interface FiltresIndicateursProps {
  recherche: string;
  setRecherche(valeur: string): void;
  chantierFiltre: string | null;
  setChantierFiltre(chantierId: string | null): void;
  mailleFiltre: $Enums.Maille | null;
  setMailleFiltre(maille: $Enums.Maille | null): void;
  optionsChantiers: { id: string; nom: string }[];
}

export const FiltresIndicateurs = ({
  recherche,
  setRecherche,
  chantierFiltre,
  setChantierFiltre,
  mailleFiltre,
  setMailleFiltre,
  optionsChantiers,
}: FiltresIndicateursProps) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center">
    <div className="md:w-96">
      <BarreDeRecherche
        changementDeLaRechercheCallback={(event) =>
          setRecherche(event.target.value)
        }
        valeur={recherche}
      />
    </div>
    <div className="fr-select-group fr-mb-0 md:w-72">
      <label className="fr-sr-only" htmlFor="filtre-chantier">
        Chantier
      </label>
      <select
        className="fr-select"
        id="filtre-chantier"
        onChange={(event) => setChantierFiltre(event.target.value || null)}
        value={chantierFiltre ?? ""}
      >
        <option value="">Tous mes chantiers</option>
        {optionsChantiers.map((chantier) => (
          <option key={chantier.id} value={chantier.id}>
            {chantier.nom}
          </option>
        ))}
      </select>
    </div>
    <SegmentedControl.Root
      aria-label="Filtrer par maille"
      className="overflow-x-auto md:ml-auto"
      onValueChange={(valeur) => {
        if (!valeur) return;
        setMailleFiltre(valeur === "TOUTES" ? null : (valeur as $Enums.Maille));
      }}
      type="single"
      value={mailleFiltre ?? "TOUTES"}
    >
      {OPTIONS_MAILLE.map((option) => (
        <SegmentedControl.Item key={option.valeur} value={option.valeur}>
          {option.libelle}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  </div>
);
