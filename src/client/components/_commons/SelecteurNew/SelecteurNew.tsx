import { useState } from "react";
import { Select } from "@/components/shared/Select";
import { clsxm } from "@/utils/clsxm";

export type SelecteurNewOption<T> = {
  libelle: string;
  valeur: T;
  desactivee?: boolean;
};

export const SelecteurNew = <T extends string>({
  htmlName,
  options,
  erreurMessage,
  onChange,
  valeurSelectionnee,
  libelle,
  placeholder = "Sélectionner...",
  showSearch = true,
  className,
}: {
  htmlName: string;
  options: SelecteurNewOption<T>[];
  erreurMessage?: string;
  onChange?: (valeur: T) => void;
  valeurSelectionnee?: T;
  libelle?: React.ReactNode;
  placeholder?: string;
  showSearch?: boolean;
  className?: string;
}) => {
  const [recherche, setRecherche] = useState("");

  const optionsFiltrees = showSearch
    ? options.filter((option) =>
        option.libelle.toLowerCase().includes(recherche.toLowerCase()),
      )
    : options;

  return (
    <div className={clsxm("flex flex-col gap-1", className)}>
      {libelle ? (
        <label className="fr-label" htmlFor={htmlName}>
          {libelle}
        </label>
      ) : null}

      <Select.Root
        onValueChange={(value) => onChange?.(value as T)}
        value={valeurSelectionnee}
      >
        <Select.Trigger
          className={clsxm("w-50", {
            "!border-b-red-500": erreurMessage,
          })}
          id={htmlName}
        >
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>

        <Select.Content className="max-h-96 overflow-hidden !w-[var(--radix-select-trigger-width)]">
          {showSearch ? (
            <div className="sticky top-0 bg-white z-10 px-4 pb-2 pt-1">
              <input
                aria-label="Rechercher"
                className="w-full !px-3 !py-2 !border-b-2 !border-primary !text-sm !bg-dsfr-alt-blue-france !placeholder-dsfr-mention-grey placeholder:italic"
                onChange={(event) => setRecherche(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Rechercher..."
                type="text"
                value={recherche}
              />
            </div>
          ) : null}

          <div className="max-h-80 overflow-y-auto">
            {optionsFiltrees.length === 0 ? (
              <div className="px-4 py-2 text-sm text-dsfr-mention-grey text-center">
                Aucun résultat
              </div>
            ) : (
              optionsFiltrees.map((option) => (
                <Select.Item
                  disabled={option.desactivee}
                  key={String(option.valeur)}
                  value={option.valeur}
                >
                  {option.libelle}
                </Select.Item>
              ))
            )}
          </div>
        </Select.Content>
      </Select.Root>

      {erreurMessage ? (
        <p className="fr-error-text fr-mt-1v">{erreurMessage}</p>
      ) : null}
    </div>
  );
};
