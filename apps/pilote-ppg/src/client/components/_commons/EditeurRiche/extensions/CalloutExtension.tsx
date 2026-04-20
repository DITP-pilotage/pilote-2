import { ComponentType } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Callout } from "@/client/components/shared/Callout";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";

type CalloutColor =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "blue"
  | "moutarde";

const CALLOUT_COLORS: CalloutColor[] = [
  "info",
  "success",
  "warning",
  "error",
  "blue",
  "moutarde",
];

const colorIconMap: Record<
  CalloutColor,
  ComponentType<{ className: string; fill: string }>
> = {
  info: InformationPleineIcon,
  success: InformationPleineIcon,
  warning: WarningIcon,
  error: ErrorWarningIcon,
  blue: InformationPleineIcon,
  moutarde: WarningIcon,
};

const colorLabels: Record<CalloutColor, string> = {
  info: "Info",
  success: "Succès",
  warning: "Attention",
  error: "Erreur",
  blue: "Bleu",
  moutarde: "Moutarde",
};

function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const color = (node.attrs.color as CalloutColor) || "info";

  return (
    <NodeViewWrapper>
      <Callout.Root color={color}>
        <Callout.Icon icone={colorIconMap[color]} />
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
                {CALLOUT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {colorLabels[c]}
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
