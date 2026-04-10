import { useCallback, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { flushSync } from "react-dom";
import { toast } from "sonner";

const filtreExport = (node: Node) =>
  !(node instanceof Element) ||
  node.getAttribute("data-html-to-image-ignore") === null;

const optionsExport = {
  pixelRatio: 2,
  backgroundColor: "#ffffff",
  filter: filtreExport,
};

export const useExportImage = (nomFichier: string) => {
  const ref = useRef<HTMLDivElement>(null);
  const [modeExport, setModeExport] = useState(false);

  const capturerImage = useCallback(
    async <T>(
      capturer: (element: HTMLDivElement) => Promise<T>,
    ): Promise<T | null> => {
      if (!ref.current) return null;

      flushSync(() => {
        setModeExport(true);
      });

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return await capturer(ref.current);
      } finally {
        setModeExport(false);
      }
    },
    [],
  );

  const enregistrerCommeImage = useCallback(async () => {
    try {
      const dataUrl = await capturerImage((element) =>
        toPng(element, optionsExport),
      );
      if (!dataUrl) return;

      const lien = document.createElement("a");
      lien.download = `${nomFichier}.png`;
      lien.href = dataUrl;
      lien.click();
      lien.remove();
    } catch {
      toast.error("Erreur lors de l'export de l'image");
    }
  }, [capturerImage, nomFichier]);

  const copierDansLePressePapiers = useCallback(async () => {
    try {
      const blob = await capturerImage((element) =>
        toBlob(element, optionsExport),
      );
      if (blob == null) return;

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      toast.success("Image copiée dans le presse-papiers", { duration: 3000 });
    } catch {
      toast.error("Erreur lors de la copie dans le presse-papiers");
    }
  }, [capturerImage]);

  return { ref, modeExport, enregistrerCommeImage, copierDansLePressePapiers };
};
