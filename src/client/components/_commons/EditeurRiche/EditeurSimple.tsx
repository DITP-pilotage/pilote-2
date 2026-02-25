import { FunctionComponent } from "react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { EditeurRiche, EditeurRicheProps } from "./EditeurRiche";

const extensions = [
  StarterKit.configure({
    heading: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    hardBreak: false,
  }),
  Link.configure({
    openOnClick: false,
  }),
  Underline,
];

export const EditeurSimple: FunctionComponent<
  Omit<EditeurRicheProps, "extensions">
> = (props) => {
  return <EditeurRiche extensions={extensions} {...props} />;
};
