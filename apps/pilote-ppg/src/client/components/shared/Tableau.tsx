import { ComponentPropsWithoutRef } from "react";
import { clsxm } from "@/utils/clsxm";

// Reprend l'apparence du composant tableau du DSFR 1.11 (`.fr-table`) pour s'en passer.
// Chaque primitive fusionne ses classes par défaut avec le `className` reçu via `clsxm` :
// en cas de conflit, la classe passée par l'appelant l'emporte.

// `.fr-table` annulait les marges que le DSFR donne aux `p`, titres et `fr-text--*` (1,5rem en bas)
// pour tout son contenu. À poser aussi sur un conteneur qui regroupe le tableau et d'autres éléments.
export const SANS_ESPACEMENT_TEXTE_DSFR =
  "[--text-spacing:0] [--title-spacing:0]";

export const Tableau = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"table">) => (
  <table
    className={clsxm(
      "w-full border-collapse",
      SANS_ESPACEMENT_TEXTE_DSFR,
      className,
    )}
    {...props}
  />
);

export const TableauEnTete = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"thead">) => (
  <thead
    className={clsxm(
      "bg-dsfr-contrast-grey text-dsfr-grey-50 bg-[image:linear-gradient(0deg,theme(colors.dsfr-grey-200),theme(colors.dsfr-grey-200))] bg-no-repeat bg-bottom bg-[size:100%_2px]",
      className,
    )}
    {...props}
  />
);

export const TableauCorps = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"tbody">) => (
  <tbody className={clsxm("bg-dsfr-grey-1000", className)} {...props} />
);

export const TableauLigne = ({
  className,
  zebre = true,
  ...props
}: ComponentPropsWithoutRef<"tr"> & { zebre?: boolean }) => (
  <tr
    className={clsxm(zebre && "even:bg-dsfr-contrast-grey", className)}
    {...props}
  />
);

export const TableauCelluleEnTete = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) => (
  <th
    className={clsxm(
      "px-4 pt-4 pb-4.5 text-left align-middle text-sm/6 font-bold",
      className,
    )}
    {...props}
  />
);

export const TableauCellule = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) => (
  <td
    className={clsxm("p-4 text-left align-middle text-sm/6", className)}
    {...props}
  />
);
