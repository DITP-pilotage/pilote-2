import { useState } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import {
  CLASSES_CONTENU_ACCORDEON,
  CLASSES_DECLENCHEUR_ACCORDEON,
  CLASSES_ENTETE_ACCORDEON,
} from "@/client/components/shared/Accordion";
import { clsxm } from "@/utils/clsxm";

function AccordionNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const title = node.attrs.title as string;

  return (
    <NodeViewWrapper>
      <div className="border border-gray-200 rounded my-2">
        <div
          className={clsxm(CLASSES_ENTETE_ACCORDEON, "rounded-t")}
          contentEditable={false}
        >
          <button
            className={CLASSES_DECLENCHEUR_ACCORDEON}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            {editor.isEditable ? (
              <input
                className="bg-transparent border-none outline-none flex-1 font-medium text-base cursor-text"
                onChange={(event) =>
                  updateAttributes({ title: event.target.value })
                }
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Titre de l'accordéon..."
                value={title}
              />
            ) : (
              <span>{title}</span>
            )}
            <svg
              className={`w-5 h-5 transition-transform duration-200 ease-in-out flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
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
          </button>
        </div>
        <div
          className={clsxm(
            "overflow-hidden transition-all duration-200",
            isOpen ? CLASSES_CONTENU_ACCORDEON : "!bg-dsfr-alt-blue-france",
          )}
          style={isOpen ? undefined : { maxHeight: 0, padding: 0 }}
        >
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    accordionItem: {
      insertAccordion: (attrs?: { title?: string }) => ReturnType;
    };
  }
}

export const AccordionExtension = Node.create({
  name: "accordionItem",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      title: {
        default: "Titre",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-title") || "Titre",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-title": attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="accordion-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "accordion-item" }, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertAccordion:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title: attrs?.title || "Titre" },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView);
  },
});
