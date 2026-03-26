import { RefObject, useCallback } from "react";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";

export const useExportCartographie = ({
  widgetRef,
  nomFichier,
}: {
  widgetRef: RefObject<HTMLElement | null>;
  nomFichier: string;
}) => {
  const enregistrerCommeImage = useCallback(async () => {
    if (!widgetRef.current) return;

    const dataUrl = await toPng(widgetRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const lien = document.createElement("a");
    lien.download = `${nomFichier}.png`;
    lien.href = dataUrl;
    lien.click();
  }, [widgetRef, nomFichier]);

  const copierImageDansLePressePapiers = useCallback(async () => {
    if (!widgetRef.current) return;

    const blob = await toBlob(widgetRef.current, {
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
  }, [widgetRef]);

  const copierCSVDansLePressePapiers = useCallback(async (csv: string) => {
    await navigator.clipboard.writeText(csv);

    toast.success("Données CSV copiées dans le presse-papiers", {
      duration: 3000,
    });
  }, []);

  return {
    enregistrerCommeImage,
    copierImageDansLePressePapiers,
    copierCSVDansLePressePapiers,
  };
};
