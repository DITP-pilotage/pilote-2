import { useRef } from "react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

export const BaseDisplayTool = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const copierDansLePressePapiers = async () => {
    const element = contentRef.current;
    if (element == null) return;

    const blob = await toBlob(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    if (blob == null) return;

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    toast.success("Image copiée dans le presse-papiers", {
      duration: 3000,
    });
  };

  return (
    <div className="isolate animate-fade-in bg-white p-2 shadow-lg rounded-lg border border-gray-300/30 mt-12 mb-20 relative">
      <div ref={contentRef}>{children}</div>
      <button
        className="absolute top-1 right-1 p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200"
        onClick={copierDansLePressePapiers}
        title="Copier dans le presse-papiers"
        type="button"
      >
        <Icone className="w-4 h-4" icone={ClipboardIcon} />
      </button>
    </div>
  );
};
