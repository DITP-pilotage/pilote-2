export const AssistantLoader = ({ label }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 text-gray-500">
    {label && <span>{label}</span>}
    <span className="animate-bounce">.</span>
    <span className="animate-bounce [animation-delay:0.2s]">.</span>
    <span className="animate-bounce [animation-delay:0.4s]">.</span>
  </span>
);
