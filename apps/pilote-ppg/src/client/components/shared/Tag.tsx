"use client";

import { ToggleGroup } from "radix-ui";
import {
  ButtonHTMLAttributes,
  ComponentProps,
  ComponentType,
  ReactNode,
} from "react";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";

// Reproduit le composant « Tag » du DSFR (pastille arrondie bleu clair).
export type VarianteTag =
  "defaut" | "actif" | "attention" | "info" | "moutarde";

const COULEURS: Record<VarianteTag, string> = {
  defaut:
    "bg-dsfr-blue-france-925 text-dsfr-blue-france-sun-113 hover:bg-dsfr-blue-france-925-hover",
  actif: "bg-primary text-white hover:bg-dsfr-blue-france-sun-113-hover",
  attention: "bg-dsfr-warning-425 text-white",
  info: "bg-dsfr-info-main-525 text-white",
  moutarde: "bg-dsfr-moutarde-main-850 text-black",
};

const TAILLES = {
  md: { tag: "min-h-8 px-3 py-1 text-sm leading-6", icone: "w-4 h-4" },
  sm: { tag: "min-h-6 px-2 py-0.5 text-xs leading-5", icone: "w-3 h-3" },
};

const CLASSES_TAG =
  "inline-flex items-center justify-center gap-1 w-fit max-w-full min-w-9 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

type Taille = keyof typeof TAILLES;
type IconeTag = ComponentType<{ className: string; fill: string }>;

export const Tag = ({
  variante = "defaut",
  taille = "md",
  iconeGauche,
  iconeDroite,
  tronque = false,
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variante?: VarianteTag;
  taille?: Taille;
  iconeGauche?: IconeTag;
  iconeDroite?: IconeTag;
  tronque?: boolean;
  children: ReactNode;
}) => (
  <button
    {...props}
    className={clsxm(
      CLASSES_TAG,
      TAILLES[taille].tag,
      COULEURS[variante],
      className,
    )}
    type="button"
  >
    {iconeGauche ? (
      <Icone
        className={clsxm(TAILLES[taille].icone, "text-current")}
        icone={iconeGauche}
      />
    ) : null}
    <span className={clsxm(tronque && "max-w-[30ch] truncate")}>
      {children}
    </span>
    {iconeDroite ? (
      <Icone
        className={clsxm(TAILLES[taille].icone, "text-current")}
        icone={iconeDroite}
      />
    ) : null}
  </button>
);

// Groupe de tags à choix unique : un choix reste toujours sélectionné.
export const TagToggleGroup = {
  Root: ({
    value,
    onValueChange,
    className,
    children,
    ...props
  }: Omit<
    ComponentProps<typeof ToggleGroup.Root>,
    "type" | "value" | "defaultValue" | "onValueChange"
  > & {
    value: string;
    onValueChange: (valeur: string) => void;
  }) => (
    <ToggleGroup.Root
      {...props}
      className={clsxm("flex flex-wrap items-center gap-2", className)}
      onValueChange={(valeur) => {
        if (valeur) onValueChange(valeur);
      }}
      type="single"
      value={value}
    >
      {children}
    </ToggleGroup.Root>
  ),
  Item: ({
    taille = "md",
    className,
    children,
    ...props
  }: ComponentProps<typeof ToggleGroup.Item> & { taille?: Taille }) => (
    <ToggleGroup.Item
      {...props}
      className={clsxm(
        CLASSES_TAG,
        TAILLES[taille].tag,
        COULEURS.defaut,
        "data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:cursor-default",
        className,
      )}
    >
      {children}
    </ToggleGroup.Item>
  ),
};
