import { Accordion } from "radix-ui";
import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
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
  <svg
    aria-hidden="true"
    className={clsxm(
      "w-4 h-4 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180",
      className,
    )}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 9l-7 7-7-7"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
  </svg>
);
