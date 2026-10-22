import { Content } from "pdfmake/interfaces";
import { color } from "@/server/pdf/colors";
import { px } from "@/server/pdf/units";

const SEPARATOR_COLOR = color("dsfr-grey-900");

export function separatorPdf(
  margin: [number, number, number, number] = [0, px(8), 0, px(8)],
): Content {
  return {
    table: { widths: ["*"], body: [[""]] },
    layout: {
      hLineWidth: (index: number) => (index === 0 ? px(1) : 0),
      vLineWidth: () => 0,
      hLineColor: () => SEPARATOR_COLOR,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin,
  };
}
