import { Label, Popover } from "radix-ui";
import { FunctionComponent, useId, useState } from "react";
import { MultiSelectProps } from "@/components/_commons/MultiSelect/MultiSelect.interface";
import BoutonToutSélectionner from "@/components/_commons/BoutonsToutSélectionner/BoutonsToutSélectionner";
import { Checkbox } from "@/components/shared/Checkbox";
import { SearchInput } from "@/components/shared/SearchInput";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { clsxm } from "@/utils/clsxm";
import { useMultiSelect } from "./useMultiSelect";

export const MultiSelect: FunctionComponent<MultiSelectProps> = ({
  suffixeLibellé,
  optionsGroupées,
  valeursSélectionnéesParDéfaut,
  changementValeursSélectionnéesCallback,
  label,
  afficherBoutonsSélection,
  desactive,
}) => {
  const id = useId();
  const [estOuvert, setEstOuvert] = useState(false);
  const {
    mettreÀJourLesValeursSélectionnées,
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    valeursSélectionnées,
    uniqueId,
    libellé,
  } = useMultiSelect(
    optionsGroupées,
    suffixeLibellé,
    changementValeursSélectionnéesCallback,
    estOuvert,
    valeursSélectionnéesParDéfaut,
  );

  return (
    <div className="flex flex-col gap-1">
      <Label.Root className="fr-label" htmlFor={id}>
        {label}
      </Label.Root>
      {afficherBoutonsSélection ? (
        <BoutonToutSélectionner
          className="fr-mt-2w"
          onClickToutDésélectionner={() =>
            changementValeursSélectionnéesCallback([])
          }
          onClickToutSélectionner={() =>
            changementValeursSélectionnéesCallback(
              optionsGroupéesFiltrées.flatMap((groupe) =>
                groupe.options.map((option) => option.value),
              ),
            )
          }
        />
      ) : null}
      <Popover.Root
        onOpenChange={(ouvert) => {
          setEstOuvert(ouvert);
          if (!ouvert) setRecherche("");
        }}
        open={estOuvert}
      >
        <Popover.Trigger asChild>
          <button
            className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-left border border-solid rounded-t border-b-2 border-b-gray-600 bg-dsfr-contrast-grey data-[state=open]:border-b-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={desactive}
            id={id}
            title={libellé}
            type="button"
          >
            <span className="min-w-0 truncate">{libellé}</span>
            <Icone className="shrink-0 text-current" icone={ArrowSLine2Icon} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            className="z-50 w-[var(--radix-popover-trigger-width)] max-h-96 overflow-y-auto rounded-md border border-gray-100 bg-white p-4 shadow-md data-[state=open]:animate-dropdown-fade-in data-[state=closed]:animate-dropdown-fade-out"
            sideOffset={4}
          >
            <SearchInput
              button="none"
              inputClassName="py-1.5 text-sm"
              label="Filtrer les options"
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher..."
              value={recherche}
            />
            {optionsGroupéesFiltrées.map((groupe) =>
              groupe.options.length === 0 ? null : (
                <fieldset
                  className="mt-4 border-0 p-0"
                  key={`${groupe.label} ${uniqueId}`}
                >
                  <legend className="mb-2 text-xs font-bold uppercase text-dsfr-mention-grey">
                    {groupe.label}
                  </legend>
                  <div className="flex flex-col gap-2">
                    {groupe.options.map((option) => {
                      const optionId = `${uniqueId}-${option.value}`;
                      return (
                        <div
                          className="flex items-center gap-2"
                          key={option.value}
                        >
                          <Checkbox
                            checked={valeursSélectionnées.has(option.value)}
                            disabled={option.disabled}
                            id={optionId}
                            onCheckedChange={() =>
                              mettreÀJourLesValeursSélectionnées(option.value)
                            }
                          />
                          <Label.Root
                            className={clsxm(
                              "flex items-center gap-2 text-sm",
                              option.disabled && "text-dsfr-grey-625",
                            )}
                            htmlFor={optionId}
                          >
                            {option.label}
                            {option.afficherIcone ? (
                              <Icone
                                className="w-4 h-4 text-error"
                                icone={CloseCircleIcon}
                              />
                            ) : null}
                          </Label.Root>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ),
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
