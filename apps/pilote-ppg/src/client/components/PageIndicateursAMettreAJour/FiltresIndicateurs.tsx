import { $Enums } from "@prisma/client";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { FiltreChantiers } from "./FiltreChantiers";

const OPTIONS_MAILLE = [
  { valeur: "TOUTES", libelle: "Toutes" },
  { valeur: $Enums.Maille.NAT, libelle: "Nationale" },
  { valeur: $Enums.Maille.REG, libelle: "Régionale" },
  { valeur: $Enums.Maille.DEPT, libelle: "Départementale" },
] as const;

interface FiltresIndicateursProps {
  recherche: string;
  setRecherche(valeur: string): void;
  chantiersFiltres: string[];
  setChantiersFiltres(chantierIds: string[]): void;
  mailleFiltre: $Enums.Maille | null;
  setMailleFiltre(maille: $Enums.Maille | null): void;
  optionsChantiers: { id: string; nom: string }[];
}

export const FiltresIndicateurs = ({
  recherche,
  setRecherche,
  chantiersFiltres,
  setChantiersFiltres,
  mailleFiltre,
  setMailleFiltre,
  optionsChantiers,
}: FiltresIndicateursProps) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="md:w-96">
        <BarreDeRecherche
          changementDeLaRechercheCallback={(event) =>
            setRecherche(event.target.value)
          }
          valeur={recherche}
        />
      </div>
      <FiltreChantiers
        chantiersFiltres={chantiersFiltres}
        optionsChantiers={optionsChantiers}
        setChantiersFiltres={setChantiersFiltres}
      />
      <SegmentedControl.Root
        aria-label="Filtrer par maille"
        className="overflow-x-auto md:ml-auto"
        onValueChange={(valeur) => {
          if (!valeur) return;
          setMailleFiltre(
            valeur === "TOUTES" ? null : (valeur as $Enums.Maille),
          );
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
};
