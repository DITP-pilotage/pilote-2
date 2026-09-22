import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import {
  Callout,
  CalloutColor,
  iconeCallout,
  VARIANTES_CALLOUT,
} from "@/client/components/shared/Callout";

function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const color = (node.attrs.color as CalloutColor) || "info";

  return (
    <NodeViewWrapper>
      <Callout.Root color={color}>
        <Callout.Icon icone={iconeCallout(color)} />
        <div className="flex-1 min-w-0">
          {editor.isEditable && (
            <div contentEditable={false} className="mb-2">
              <select
                className="text-xs border rounded px-1 py-0.5 bg-white"
                onChange={(event) =>
                  updateAttributes({ color: event.target.value })
                }
                value={color}
              >
                {VARIANTES_CALLOUT.map(({ couleur, libelle }) => (
                  <option key={couleur} value={couleur}>
                    {libelle}
                  </option>
                ))}
              </select>
            </div>
          )}
          <NodeViewContent className="text-sm leading-relaxed" />
        </div>
      </Callout.Root>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (attrs?: { color?: CalloutColor }) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      color: {
        default: "info",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-color") || "info",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-color": attributes.color,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "callout" }, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },
});
