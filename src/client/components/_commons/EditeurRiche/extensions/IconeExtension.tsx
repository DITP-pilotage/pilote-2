import { ComponentType } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { EtoileIcon } from "@/components/_commons/Icones/EtoileIcon";

type IconType = "info" | "warning" | "error" | "arrowLine1" | "etoile";

const ICON_TYPES: IconType[] = [
  "info",
  "warning",
  "error",
  "arrowLine1",
  "etoile",
];

const iconMap: Record<
  IconType,
  ComponentType<{ className: string; fill: string }>
> = {
  info: InformationPleineIcon,
  warning: WarningIcon,
  error: ErrorWarningIcon,
  arrowLine1: ArrowLine1Icon,
  etoile: EtoileIcon,
};

const iconLabels: Record<IconType, string> = {
  info: "Info",
  warning: "Attention",
  error: "Erreur",
  arrowLine1: "Flèche",
  etoile: "Étoile",
};

function IconeNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const type = (node.attrs.type as IconType) || "info";
  const IconComponent = iconMap[type];

  if (!IconComponent) return null;

  return (
    <NodeViewWrapper as="span" className="inline-flex items-center">
      {editor.isEditable && (
        <select
          className="text-xs border rounded px-0.5 mr-1 bg-white"
          contentEditable={false}
          onChange={(event) => updateAttributes({ type: event.target.value })}
          value={type}
        >
          {ICON_TYPES.map((iconType) => (
            <option key={iconType} value={iconType}>
              {iconLabels[iconType]}
            </option>
          ))}
        </select>
      )}
      <IconComponent
        className="w-5 h-5 inline-block align-middle"
        fill="currentColor"
      />
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    icone: {
      insertIcone: (attrs?: { type?: IconType }) => ReturnType;
    };
  }
}

export const IconeExtension = Node.create({
  name: "icone",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-icon-type") || "info",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-icon-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="icone"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-type": "icone" }, HTMLAttributes)];
  },

  addCommands() {
    return {
      insertIcone:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(IconeNodeView);
  },
});
