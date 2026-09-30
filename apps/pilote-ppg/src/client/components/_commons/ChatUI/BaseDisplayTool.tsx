import { useRef } from "react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";

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
    <div className="isolate animate-fade-in bg-white p-2 shadow-lg rounded-lg border border-gray-300/30 mt-4 mb-8 relative">
      <div ref={contentRef}>{children}</div>
      <BoutonCopier
        className="absolute top-1 right-1 p-1 rounded bg-white/80 hover:bg-gray-100 border border-gray-200"
        libelle="Copier dans le presse-papiers"
        onClick={copierDansLePressePapiers}
      />
    </div>
  );
};
