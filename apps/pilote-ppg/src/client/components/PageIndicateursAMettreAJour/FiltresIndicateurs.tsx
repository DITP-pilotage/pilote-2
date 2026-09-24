import { $Enums } from "@prisma/client";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
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
  const nomsChantiers = new Map(
    optionsChantiers.map((chantier) => [chantier.id, chantier.nom]),
  );

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
      <MultiSelectFiltre
        className="md:w-auto"
        classNameBouton="min-w-[18rem]"
        getOptionLabel={(chantierId) =>
          nomsChantiers.get(chantierId) ?? chantierId
        }
        getPlaceholder={(valeurs) => {
          if (valeurs.length === 0) return "Tous mes chantiers";
          if (valeurs.length === 1)
            return nomsChantiers.get(valeurs[0]) ?? valeurs[0];
          return `${valeurs.length} chantiers`;
        }}
        label="Chantier"
        onChange={setChantiersFiltres}
        optionGroups={[
          {
            label: "",
            options: optionsChantiers.map((chantier) => chantier.id),
          },
        ]}
        showGroupSelection={false}
        values={chantiersFiltres}
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
