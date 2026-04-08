import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const remarkPlugins = [remarkGfm];

export const AssistantMessageText = memo(function AssistantMessageText({
  text,
}: {
  text: string;
}) {
  return (
    <div className="albert-markdown">
      <ReactMarkdown remarkPlugins={remarkPlugins}>{text}</ReactMarkdown>
    </div>
  );
});
