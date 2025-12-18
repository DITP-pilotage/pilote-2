import { Accordion } from "radix-ui";
import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Disclosure = ({
  trigger,
  children,
}: {
  trigger: string;
  children: ReactNode;
}) => {
  return (
    <Accordion.Root collapsible type="single">
      <Accordion.Item className="border-0" value="item-1">
        <Accordion.Header className="!mb-0">
          <Accordion.Trigger
            className={clsxm(
              "fr-link !inline-flex items-center gap-2 !font-normal",
              "!p-0 !mb-0",
              "group",
            )}
          >
            {trigger}
            <svg
              className="w-4 h-4 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"
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
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content
          className={clsxm(
            "overflow-hidden",
            "data-[state=open]:animate-accordion-open",
            "data-[state=closed]:animate-accordion-close",
            "!pt-4",
          )}
        >
          {children}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};
