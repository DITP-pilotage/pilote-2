import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";

export const FiltreChantiers = ({
  chantiersFiltres,
  setChantiersFiltres,
  optionsChantiers,
}: {
  chantiersFiltres: string[];
  setChantiersFiltres(chantierIds: string[]): void;
  optionsChantiers: { id: string; nom: string }[];
}) => {
  const nomsChantiers = new Map(
    optionsChantiers.map((chantier) => [chantier.id, chantier.nom]),
  );

  return (
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
  );
};
