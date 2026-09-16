import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import type { Extensions } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { AccordionExtension } from "@/components/_commons/EditeurRiche/extensions/AccordionExtension";
import { CalloutExtension } from "@/components/_commons/EditeurRiche/extensions/CalloutExtension";
import { IconeExtension } from "@/components/_commons/EditeurRiche/extensions/IconeExtension";
import { VideoExtension } from "@/components/_commons/EditeurRiche/extensions/VideoExtension";
import { ImageMiseEnPage } from "./ImageMiseEnPage";
import type { ActionsBlocs } from "../blocs";
import { SlashCommand } from "./SlashCommand";

export const extensionsCentreAide = (
  actions: ActionsBlocs = {},
  placeholder = "Écrivez, ou tapez « / » pour insérer un bloc…",
): Extensions => [
  // Entrée = nouveau paragraphe : la mise en titre ne s'applique qu'au bloc
  // sélectionné, jamais aux lignes adjacentes (PIL-1685 #3).
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    code: false,
    codeBlock: false,
  }),
  TextStyle,
  Color,
  Underline,
  Link.configure({ openOnClick: false }),
  ImageMiseEnPage.configure({ allowBase64: false }),
  Placeholder.configure({ placeholder }),
  CalloutExtension,
  AccordionExtension,
  IconeExtension,
  VideoExtension,
  SlashCommand.configure(actions),
];
