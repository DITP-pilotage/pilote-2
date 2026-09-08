import { FunctionComponent } from "react";

/**
 * Bouton officiel ProConnect.
 *
 * Le composant `fr-connect` du DSFR embarque le logo FranceConnect et ne
 * convient donc pas : ProConnect est une marque distincte, avec son propre kit.
 * On en reproduit ici la structure — libellé sur deux lignes, marque mise en
 * avant, fond bleu France — sans le glyphe, qui doit être repris tel quel du kit
 * DINUM avant la mise en production.
 */
export const BoutonProConnect: FunctionComponent<{ onClick: () => void }> = ({
  onClick,
}) => (
  <button
    className="flex w-full flex-col items-center justify-center gap-0.5 bg-primary px-4 py-3 text-white transition-colors hover:bg-dsfr-blue-france-sun-113-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    onClick={onClick}
    type="button"
  >
    <span className="text-sm leading-none font-normal">S'identifier avec</span>
    <span className="text-xl leading-tight font-bold tracking-tight">
      ProConnect
    </span>
  </button>
);
