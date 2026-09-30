import { RadioGroup as RadixRadioGroup } from "radix-ui";
import { ComponentProps, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

// Reproduit le bouton radio du DSFR : cercle bordé de bleu, pastille bleue une
// fois coché, libellé puis aide facultative en gris.
export const RadioGroup = Object.assign({}, RadixRadioGroup, {
  Root: ({
    className,
    ...props
  }: ComponentProps<typeof RadixRadioGroup.Root>) => (
    <RadixRadioGroup.Root
      {...props}
      className={clsxm("flex flex-col gap-4", className)}
    />
  ),
  Item: ({
    id,
    libelle,
    aide,
    className,
    ...props
  }: Omit<ComponentProps<typeof RadixRadioGroup.Item>, "id" | "children"> & {
    id: string;
    libelle: ReactNode;
    aide?: ReactNode;
  }) => (
    <div className={clsxm("flex items-start gap-2", className)}>
      <RadixRadioGroup.Item
        {...props}
        aria-describedby={aide ? `${id}-aide` : undefined}
        className="m-px flex size-[22px] shrink-0 items-center justify-center rounded-full p-0 border border-solid border-primary bg-white disabled:border-dsfr-grey-625 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus"
        id={id}
      >
        <RadixRadioGroup.Indicator className="size-2.5 shrink-0 rounded-full bg-primary" />
      </RadixRadioGroup.Item>
      <div className="flex flex-col">
        <label className="text-base leading-6" htmlFor={id}>
          {libelle}
        </label>
        {aide ? (
          <span
            className="text-xs leading-5 text-dsfr-mention-grey"
            id={`${id}-aide`}
          >
            {aide}
          </span>
        ) : null}
      </div>
    </div>
  ),
});
