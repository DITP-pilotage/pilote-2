import { describe, expect, it } from "vitest";

import { PDFContentAdapter } from "@/server/evaluation/domain/PDFContentAdapter";
import { GenererPDFEvaluationHandler } from "@/server/evaluation/handlers/GenererPDFEvaluationHandler";

const adapter: PDFContentAdapter = {
  getContent: () => [{ text: "Auto-évaluation : résultats" }],
};

describe("GenererPDFEvaluationHandler", () => {
  it("rend un document PDF exploitable, encodé en base64", async () => {
    const base64 = await new GenererPDFEvaluationHandler().execute(adapter);

    const buffer = Buffer.from(base64, "base64");
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.subarray(-6).toString("latin1")).toContain("%%EOF");
  });
});
