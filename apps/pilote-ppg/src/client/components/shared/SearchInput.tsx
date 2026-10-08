import { ComponentProps } from "react";
import { Icone } from "@/components/_commons/Icone";
import { LoupeContourIcon } from "@/components/_commons/Icones/LoupeContourIcon";
import { clsxm } from "@/utils/clsxm";

// Reproduit la barre de recherche du DSFR (fr-search-bar) : champ gris à trait bas
// accolé à un bouton bleu carré portant la loupe.
type SearchButton = "decorative" | "submit" | "none";

export const SearchInput = ({
  placeholder = "Rechercher",
  label,
  button = "decorative",
  className,
  inputClassName,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label?: string;
  button?: SearchButton;
  inputClassName?: string;
}) => (
  <div className={clsxm("flex w-full", className)} role="search">
    <input
      aria-label={label ?? placeholder}
      className={clsxm(
        "min-w-0 flex-1 rounded-tl px-4 py-2 text-base leading-6 bg-dsfr-grey-950 text-dsfr-grey-200 border-0 border-b-2 border-solid border-primary placeholder:text-dsfr-mention-grey placeholder:italic focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus",
        button === "none" && "rounded-tr",
        inputClassName,
      )}
      placeholder={placeholder}
      type="search"
      {...props}
    />
    {button === "none" ? null : (
      <span
        aria-hidden={button === "decorative" ? true : undefined}
        className="flex shrink-0 rounded-tr bg-primary text-white"
      >
        {button === "submit" ? (
          <button
            className="flex items-center justify-center size-10 hover:bg-dsfr-blue-france-sun-113-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus"
            title="Rechercher"
            type="submit"
          >
            <Icone className="w-5 h-5 text-current" icone={LoupeContourIcon} />
            <span className="sr-only">Rechercher</span>
          </button>
        ) : (
          <span className="flex items-center justify-center size-10">
            <Icone className="w-5 h-5 text-current" icone={LoupeContourIcon} />
          </span>
        )}
      </span>
    )}
  </div>
);
