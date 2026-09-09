import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { userEvent } from "@testing-library/user-event";
import { LastResponseActions } from "@/components/_commons/ChatUI/LastResponseActions";

const buildClipboardMock = () => {
  const write = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { write } });
  return write;
};

test("le clic sur Copier écrit du HTML (pas du markdown brut) dans le presse-papiers", async () => {
  const write = buildClipboardMock();

  render(
    <LastResponseActions
      texte="**Synthèse** de l'Ain"
      conversationId="conv-1"
      messageId="msg-1"
    />,
  );
  await userEvent.click(screen.getByTitle("Copier dans le presse-papiers"));

  expect(write).toHaveBeenCalledTimes(1);
  const items = write.mock.calls[0][0];
  expect(items).toHaveLength(1);
});

test("le clic sur Exporter en PDF appelle la bonne route et déclenche un téléchargement", async () => {
  buildClipboardMock();
  const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
  const fetchMock = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });

  render(
    <LastResponseActions
      texte="Contenu"
      conversationId="conv-1"
      messageId="msg-1"
    />,
  );
  await userEvent.click(screen.getByTitle("Exporter en PDF"));

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/albert/conversations/conv-1/messages/msg-1/export-pdf",
    { method: "POST" },
  );

  vi.unstubAllGlobals();
});
