import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { registreIcones } from "../registreIcones";

function IconeNodeView({ node }: NodeViewProps) {
  const type = (node.attrs.type as string) || "info";
  const IconComponent = registreIcones[type];

  if (!IconComponent) return null;

  return (
    <NodeViewWrapper as="span" className="inline-flex items-center">
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
      insertIcone: (attrs?: { type?: string }) => ReturnType;
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
        default: "InformationPleineIcon",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-icon-type") || "InformationPleineIcon",
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
