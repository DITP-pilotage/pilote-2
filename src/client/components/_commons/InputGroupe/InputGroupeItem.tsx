import "@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css";
import { FunctionComponent, useId } from "react";
import { MultiSelectOptionGroupée } from "@/components/_commons/MultiSelect/MultiSelect.interface";

interface MultiSelectGroupeProps {
  groupeOptions: MultiSelectOptionGroupée;
  changementÉtatCallback: (valeur: string) => void;
  valeurSelectionnee: string;
}

const InputGroupeItem: FunctionComponent<MultiSelectGroupeProps> = ({
  groupeOptions,
  changementÉtatCallback,
  valeurSelectionnee,
}) => {
  const id = useId();

  if (groupeOptions.options.length === 0) {
    return null;
  }

  return (
    <>
      <p className="text-dsfr-mention-grey border-t border-black fr-mb-1w fr-pt-1w fr-pl-2w">
        {groupeOptions.label.toUpperCase()}
      </p>
      <ul className="p-0 list-none fr-m-">
        {groupeOptions.options.map((option, index) => (
          <li
            className="fr-py-1w fr-pl-2w"
            key={`${option.value} ${id}`}
            style={
              index % 2 === 1
                ? ({
                    backgroundColor: "var(--background-contrast-grey)",
                    "--idle": "transparent",
                    "--hover": "var(--background-contrast-grey-hover)",
                    "--active": "var(--background-contrast-grey-active)",
                  } as React.CSSProperties)
                : ({
                    backgroundColor: "var(--background-alt-grey)",
                    "--idle": "transparent",
                    "--hover": "var(--background-alt-grey-hover)",
                    "--active": "var(--background-alt-grey-active)",
                  } as React.CSSProperties)
            }
          >
            <button
              className="w-full texte-gauche fr-p-0"
              disabled={valeurSelectionnee === option.value || option.disabled}
              id={`${option.value} ${id}`}
              name={option.value}
              onClick={() => changementÉtatCallback(option.value)}
              type="button"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default InputGroupeItem;
