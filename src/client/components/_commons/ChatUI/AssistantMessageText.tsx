import { memo } from "react";
import { marked } from "marked";

export const AssistantMessageText = memo(function AssistantMessageText({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="albert-markdown"
      dangerouslySetInnerHTML={{
        __html: marked.parse(text, { async: false }) as string,
      }}
    />
  );
});
