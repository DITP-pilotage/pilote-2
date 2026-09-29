import { Accordion } from "radix-ui";
import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import "./accordion.css";

export const Disclosure = ({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) => {
  return (
    <Accordion.Root collapsible type="single">
      <Accordion.Item className="border-0" value="item-1">
        <Accordion.Header className="!mb-0">
          <Accordion.Trigger asChild className="group">
            {trigger}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content
          className={clsxm("overflow-hidden", "accordion-content", "!pt-4")}
        >
          {children}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

export const DisclosureIndicator = ({ className }: { className?: string }) => (
  <Icone
    className={clsxm(
      "w-4 h-4 text-current transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180",
      className,
    )}
    icone={ArrowSLine2Icon}
  />
);
