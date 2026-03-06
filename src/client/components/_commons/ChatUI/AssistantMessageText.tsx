import { marked } from "marked";

export const AssistantMessageText = ({ text }: { text: string }) => {
  return (
    <div
      className="albert-markdown"
      dangerouslySetInnerHTML={{
        __html: marked.parse(text, { async: false }) as string,
      }}
    />
  );
};
