import { FunctionComponent } from "react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { EditeurRiche, EditeurRicheProps } from "./EditeurRiche";
import { CalloutExtension } from "./extensions/CalloutExtension";
import { AccordionExtension } from "./extensions/AccordionExtension";
import { IconeExtension } from "./extensions/IconeExtension";
import { VideoExtension } from "./extensions/VideoExtension";

const extensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
  }),
  TextStyle,
  Color,
  Underline,
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
  CalloutExtension,
  AccordionExtension,
  IconeExtension,
  VideoExtension,
];

export const EditeurCentreAide: FunctionComponent<
  Omit<EditeurRicheProps, "extensions">
> = (props) => {
  return <EditeurRiche extensions={extensions} {...props} />;
};
