import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const buildMessage = (): PiloteUIMessage =>
  ({
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Une réponse simple." }],
  }) as PiloteUIMessage;

test("affiche la barre d'actions quand c'est le dernier message assistant", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming={false}
      isLastAssistantMessage
      conversationId="conv-1"
    />,
  );

  expect(screen.getByTitle("Exporter en PDF")).toBeInTheDocument();
  expect(screen.getByTitle("Copier dans le presse-papiers")).toBeInTheDocument();
});

test("n'affiche pas la barre d'actions sur un message assistant qui n'est pas le dernier", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming={false}
      isLastAssistantMessage={false}
      conversationId="conv-1"
    />,
  );

  expect(screen.queryByTitle("Exporter en PDF")).not.toBeInTheDocument();
  expect(
    screen.queryByTitle("Copier dans le presse-papiers"),
  ).not.toBeInTheDocument();
});

test("n'affiche pas la barre d'actions pendant le streaming, même sur le dernier message", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming
      isLastAssistantMessage
      conversationId="conv-1"
    />,
  );

  expect(screen.queryByTitle("Exporter en PDF")).not.toBeInTheDocument();
});

test("n'affiche pas la barre d'actions si le message n'a pas d'id (conversation persistée avant le fix de generateMessageId)", () => {
  render(
    <AssistantMessage
      message={{ ...buildMessage(), id: "" }}
      isStreaming={false}
      isLastAssistantMessage
      conversationId="conv-1"
    />,
  );

  expect(screen.queryByTitle("Exporter en PDF")).not.toBeInTheDocument();
  expect(
    screen.queryByTitle("Copier dans le presse-papiers"),
  ).not.toBeInTheDocument();
});
