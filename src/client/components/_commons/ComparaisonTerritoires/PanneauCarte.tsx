import { ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import { SelecteurTypeCarte } from "./SelecteurTypeCarte";

type PanneauCarteProps<T extends string> = {
  typeCarte: T;
  options: { value: T; label: string }[];
  estEnComparaison: boolean;
  onChangerType: (type: T) => void;
  onComparer: () => void;
  onSupprimer: () => void;
  renderCarte: (typeCarte: T) => ReactNode;
  metadonnees: { titre: string; nomFichier: string };
};

export const PanneauCarte = <T extends string>({
  typeCarte,
  options,
  estEnComparaison,
  onChangerType,
  onComparer,
  onSupprimer,
  renderCarte,
  metadonnees,
}: PanneauCarteProps<T>) => {
  const carteRef = useRef<HTMLDivElement>(null);
  const [modeExport, setModeExport] = useState(false);

  const genererImage = async (
    callback: (element: HTMLElement) => void | Promise<void>,
  ) => {
    flushSync(() => {
      setModeExport(true);
    });

    if (!carteRef.current) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await callback(carteRef.current);
    } finally {
      setModeExport(false);
    }
  };

  const enregistrerCommeImage = async () => {
    await genererImage(async (element) => {
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const lien = document.createElement("a");
      lien.download = `${metadonnees.nomFichier}.png`;
      lien.href = dataUrl;
      lien.click();
    });
  };

  const copierDansLePressePapiers = async () => {
    await genererImage(async (element) => {
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
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2">
        <SelecteurTypeCarte
          typeCarte={typeCarte}
          options={options}
          onChange={onChangerType}
        />
        {estEnComparaison ? (
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onSupprimer}
            type="button"
          >
            <Icone className="w-4 h-4 mr-1" icone={DeleteIcon} />
            supprimer la carte
          </button>
        ) : (
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onComparer}
            type="button"
          >
            + comparer avec une autre carte
          </button>
        )}
      </div>

      <div ref={carteRef}>
        {renderCarte(typeCarte)}
        {modeExport ? (
          <div className="border-t border-gray-300 pt-4 mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-700">{metadonnees.titre}</span>
            <LogoPilote />
          </div>
        ) : null}
      </div>

      <div className="flex items-end flex-col gap-3">
        <button
          className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm whitespace-nowrap"
          onClick={enregistrerCommeImage}
          type="button"
        >
          <Icone className="w-4 h-4" icone={Download1Icon} />
          Enregistrer comme image
        </button>
        <button
          className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm whitespace-nowrap"
          onClick={copierDansLePressePapiers}
          type="button"
        >
          <Icone className="w-4 h-4" icone={ClipboardIcon} />
          Copier dans le presse-papiers
        </button>
      </div>
    </div>
  );
};
