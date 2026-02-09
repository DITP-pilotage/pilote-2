import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";
import Link from "next/link";
import {
  CalloutRoot,
  CalloutIcon,
  CalloutText,
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Badge,
  Icone,
} from "@/client/components/CentreAide/mdx-client-components";

const docsComponents = getDocsMDXComponents();

const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

const Callout = Object.assign(CalloutRoot, {
  Root: CalloutRoot,
  Icon: CalloutIcon,
  Text: CalloutText,
});

export function useMDXComponents(
  components?: Record<string, React.ComponentType>,
) {
  return {
    ...docsComponents,
    Callout,
    Accordion,
    Badge,
    Icone,
    Link,
    ...components,
  };
}
