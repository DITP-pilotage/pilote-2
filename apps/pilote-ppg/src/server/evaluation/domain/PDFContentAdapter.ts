import { Content } from "pdfmake/interfaces";

export interface PDFContentAdapter {
  getContent(): Content[];
}
