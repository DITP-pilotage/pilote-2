import { ReactNode, useRef } from "react";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { SelecteurTypeCarte } from "./SelecteurTypeCarte";

type PanneauCarteProps<T extends string> = {
  typeCarte: T;
  options: { value: T; label: string }[];
  estEnComparaison: boolean;
  onChangerType: (type: T) => void;
  onComparer: () => void;
  onSupprimer: () => void;
  renderCarte: (typeCarte: T) => ReactNode;
  nomFichier: string;
};

export const PanneauCarte = <T extends string>({
  typeCarte,
  options,
  estEnComparaison,
  onChangerType,
  onComparer,
  onSupprimer,
  renderCarte,
  nomFichier,
}: PanneauCarteProps<T>) => {
  const carteRef = useRef<HTMLDivElement>(null);

  const filtreExport = (node: HTMLElement) => !node.dataset?.htmlToImageIgnore;

  const enregistrerCommeImage = async () => {
    if (!carteRef.current) return;

    const dataUrl = await toPng(carteRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      filter: filtreExport,
    });

    const lien = document.createElement("a");
    lien.download = `${nomFichier}.png`;
    lien.href = dataUrl;
    lien.click();
  };

  const copierDansLePressePapiers = async () => {
    if (!carteRef.current) return;

    const blob = await toBlob(carteRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      filter: filtreExport,
    });
    if (blob == null) return;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

    toast.success("Image copiée dans le presse-papiers", { duration: 3000 });
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

      <div ref={carteRef}>{renderCarte(typeCarte)}</div>

      <div className="flex items-center justify-end">
        <span className="text-primary text-sm">exporter :</span>
        <button
          onClick={enregistrerCommeImage}
          type="button"
          aria-label="Enregistrer comme image"
        >
          <Icone className="w-4 h-4" icone={Download1Icon} />
        </button>
        <button
          onClick={copierDansLePressePapiers}
          type="button"
          aria-label="Copier dans le presse-papiers"
        >
          <Icone className="w-4 h-4" icone={ClipboardIcon} />
        </button>
      </div>
    </div>
  );
};
