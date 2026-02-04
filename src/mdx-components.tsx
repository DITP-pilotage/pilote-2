import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
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
  WarningIcon,
  ArrowLine1Icon,
} from '@/client/components/CentreAide/mdx-client-components'
import Link from 'next/link'

const docsComponents = getDocsMDXComponents()

const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
})

const Callout = Object.assign(CalloutRoot, {
  Root: CalloutRoot,
  Icon: CalloutIcon,
  Text: CalloutText,
})

export function useMDXComponents(components?: Record<string, React.ComponentType>) {
  return {
    ...docsComponents,
    Callout,
    Accordion,
    Badge,
    Icone,
    WarningIcon,
    ArrowLine1Icon,
    Link,
    ...components,
  }
}
