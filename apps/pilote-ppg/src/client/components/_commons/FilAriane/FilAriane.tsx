import { FunctionComponent, useId, useState } from "react";
import Link from "next/link";
import { clsxm } from "@/utils/clsxm";

interface FilArianeProps {
  libelléPageCourante: string;
  chemin?: { nom: string; lien: string }[];
}

const ITEM_CLASSES =
  "inline leading-7 not-first:before:mx-1 not-first:before:inline-block not-first:before:size-4 not-first:before:flex-none not-first:before:bg-current not-first:before:align-[-0.0625em] not-first:before:content-[''] not-first:before:[mask-image:url(/dsfr/icons/arrows/arrow-right-s-line.svg)] not-first:before:[mask-size:100%_100%] forced-colors:not-first:before:bg-[canvastext] forced-colors:not-first:before:[forced-color-adjust:none]";

const LINK_CLASSES =
  "relative p-0 align-[0.25rem] text-xs leading-5 [--active-tint:var(--idle)] [--hover-tint:var(--idle)] forced-colors:underline forced-colors:underline-offset-[5px] forced-colors:aria-[current=page]:no-underline";

const FilAriane: FunctionComponent<FilArianeProps> = ({
  chemin,
  libelléPageCourante,
}) => {
  const [estOuvert, setEstOuvert] = useState(false);
  const id = useId();

  return (
    <nav
      aria-label="vous êtes ici :"
      className="relative mb-2 mt-4 text-xs leading-5 text-dsfr-mention-grey [--text-spacing:0_0_0.5rem] print:hidden"
      role="navigation"
    >
      <button
        aria-controls={`breadcrumb-${id}`}
        aria-expanded={estOuvert}
        className="m-0 p-0 text-xs leading-5 text-inherit bg-no-repeat [--active-tint:var(--idle)] [--hover-tint:var(--idle)] [background-image:linear-gradient(0deg,currentColor,currentColor),linear-gradient(0deg,currentColor,currentColor)] [background-position:0_100%,0_calc(100%-0.0625em)] [background-size:0_0.125em,100%_0.0625em] hover:[background-size:100%_0.125em,100%_0.0625em] active:[background-size:100%_0.125em,100%_0.0625em] aria-expanded:hidden md:hidden"
        onClick={() => setEstOuvert(!estOuvert)}
        type="button"
      >
        Voir le fil d'Ariane
      </button>
      <div
        className={clsxm(
          estOuvert
            ? "fr-collapse--expanded"
            : "fr-collapse -mx-1 -translate-y-1 px-1 md:mx-0 md:max-h-none md:translate-y-0 md:overflow-visible md:px-0 md:[visibility:inherit] md:before:content-none",
        )}
        id={`breadcrumb-${id}`}
      >
        <ol className="translate-y-1 [--li-bottom:0] [--ol-content:none] [--ol-start:0] [--ol-type:none] [--ul-start:0] [--ul-type:none] [--xl-block:0] md:translate-y-0">
          <li className={ITEM_CLASSES}>
            <Link className={LINK_CLASSES} href="/">
              Accueil
            </Link>
          </li>
          {chemin
            ? chemin.map((page) => (
                <li className={ITEM_CLASSES} key={page.nom}>
                  <Link className={LINK_CLASSES} href={page.lien}>
                    {page.nom}
                  </Link>
                </li>
              ))
            : null}
          <li className={ITEM_CLASSES}>
            <span
              aria-current="page"
              className={clsxm(
                LINK_CLASSES,
                "pointer-events-none cursor-default text-dsfr-grey-200",
              )}
            >
              {libelléPageCourante}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default FilAriane;
