import { FunctionComponent } from "react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import { EditeurRiche, EditeurRicheProps } from "./EditeurRiche";

const extensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
  }),
  TextStyle,
  Color,
  Underline,
];

export const EditeurNouveauté: FunctionComponent<
  Omit<EditeurRicheProps, "extensions">
> = (props) => {
  return <EditeurRiche extensions={extensions} {...props} />;
};
