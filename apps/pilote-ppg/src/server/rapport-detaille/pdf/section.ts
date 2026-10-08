import { Content } from "pdfmake/interfaces";
import { sectionTitlePdf } from "@/server/pdf/primitives";
import { rem } from "@/server/pdf/units";

export function section(
  titre: string,
  content: Content,
  options: { breakable?: boolean } = {},
): Content {
  return {
    stack: [sectionTitlePdf(titre), content],
    margin: [0, rem(1), 0, rem(1)],
    unbreakable: !options.breakable,
  };
}
