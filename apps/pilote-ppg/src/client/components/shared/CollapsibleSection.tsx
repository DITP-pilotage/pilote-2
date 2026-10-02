import { ReactNode } from "react";
import { Collapsible } from "@/components/shared/Collapsible";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { clsxm } from "@/utils/clsxm";

// Reproduit une rubrique repliable du menu latéral DSFR (fr-sidemenu__btn +
// fr-collapse) sur le Collapsible radix, sans le JS du DSFR.
export const CollapsibleSection = ({
  title,
  defaultOpen = false,
  className,
  triggerClassName,
  contentClassName,
  children,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) => (
  <Collapsible.Root className={className} defaultOpen={defaultOpen}>
    <Collapsible.Trigger
      className={clsxm(
        "group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold leading-6 text-primary hover:bg-dsfr-grey-1000 data-[state=open]:bg-dsfr-blue-france-925 data-[state=open]:hover:bg-dsfr-blue-france-925-hover focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dsfr-focus",
        triggerClassName,
      )}
      type="button"
    >
      {title}
      <Icone
        className="w-4 h-4 shrink-0 text-current transition-transform group-data-[state=open]:-rotate-180"
        icone={ArrowSLine2Icon}
      />
    </Collapsible.Trigger>
    <Collapsible.Content className={contentClassName}>
      {children}
    </Collapsible.Content>
  </Collapsible.Root>
);
