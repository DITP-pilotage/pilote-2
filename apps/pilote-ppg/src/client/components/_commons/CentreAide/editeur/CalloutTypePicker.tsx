import { findParentNodeClosestToPos } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";
import type { ResolvedPos } from "@tiptap/pm/model";
import { useEditorState, type NodeViewProps } from "@tiptap/react";
import {
  createElement,
  FunctionComponent,
  MouseEvent,
  useRef,
  useState,
} from "react";
import {
  CalloutColor,
  colorVariants,
  iconeCallout,
  VARIANTES_CALLOUT,
} from "@/client/components/shared/Callout";
import { clsxm } from "@/utils/clsxm";
import { FloatingToolbar, FloatingToolbarButton } from "./FloatingToolbar";

const findClosestCalloutPos = ($pos: ResolvedPos) =>
  findParentNodeClosestToPos($pos, (node) => node.type.name === "callout")?.pos;

export const CalloutTypePicker: FunctionComponent<
  Pick<NodeViewProps, "editor" | "getPos"> & {
    color: CalloutColor;
    onChange: (color: CalloutColor) => void;
  }
> = ({ color, editor, getPos, onChange }) => {
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Une sélection de texte ouvre la bulle de mise en forme au même endroit.
  const hasCaretInside = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      const { selection } = instance.state;
      return (
        instance.isFocused &&
        selection.empty &&
        findClosestCalloutPos(selection.$from) === getPos()
      );
    },
  });
  const isOpen = hasCaretInside || hasFocusWithin;

  const openFromIcon = (event: MouseEvent<HTMLButtonElement>) => {
    const pos = getPos();
    if (hasCaretInside || pos === undefined) return;

    const { doc } = editor.state;
    const calloutEnd = pos + (doc.nodeAt(pos)?.nodeSize ?? 0) - 1;
    const caret = Selection.findFrom(doc.resolve(calloutEnd), -1, true);
    if (!caret || findClosestCalloutPos(caret.$from) !== pos) {
      event.currentTarget.focus();
      return;
    }

    editor
      .chain()
      .command(({ tr }) => {
        tr.setSelection(caret);
        return true;
      })
      .focus()
      .run();
  };

  return (
    <div
      contentEditable={false}
      onBlur={(event) =>
        setHasFocusWithin(
          containerRef.current?.contains(event.relatedTarget) ?? false,
        )
      }
      onFocus={() => setHasFocusWithin(true)}
      ref={containerRef}
    >
      <button
        aria-expanded={isOpen}
        aria-label="Changer le type d'encadré"
        // Le retrait négatif agrandit la zone cliquable sans décaler l'icône.
        className={clsxm(
          "-m-1 block rounded p-1 transition-colors hover:bg-black/10",
          isOpen && "bg-black/10",
        )}
        onClick={openFromIcon}
        onMouseDown={(event) => event.preventDefault()}
        title="Changer le type d'encadré"
        type="button"
      >
        {createElement(iconeCallout(color), {
          className: "pointer-events-none h-5 w-5",
          fill: "currentColor",
        })}
      </button>
      {isOpen && (
        <FloatingToolbar label="Type d'encadré">
          {VARIANTES_CALLOUT.map(({ couleur, libelle, Icone }) => (
            <FloatingToolbarButton
              actif={couleur === color}
              key={couleur}
              label={libelle}
              onClick={() => onChange(couleur)}
            >
              <span
                className={clsxm(
                  "pointer-events-none flex h-5 w-5 items-center justify-center rounded-sm",
                  colorVariants[couleur].bg,
                  colorVariants[couleur].iconColor,
                )}
              >
                <Icone className="h-4 w-4" fill="currentColor" />
              </span>
            </FloatingToolbarButton>
          ))}
        </FloatingToolbar>
      )}
    </div>
  );
};
