import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import { classesMedia } from "./alignementMedia";

const HOTE_FICHIERS = "fichiers.numerique.gouv.fr";
const PARAMETRES_AUTOPLAY = ["autoplay", "auto_play", "autostart"];

export const estUrlHttpSure = (url: string): boolean => {
  try {
    const protocole = new URL(url).protocol;
    return protocole === "http:" || protocole === "https:";
  } catch {
    return false;
  }
};

export const sansAutoplay = (url: string): string => {
  try {
    const analysee = new URL(url);
    for (const parametre of PARAMETRES_AUTOPLAY) {
      analysee.searchParams.delete(parametre);
    }
    return analysee.toString().replace(/\?$/, "");
  } catch {
    return url;
  }
};

// Le service de fichiers sert le binaire a cette URL : on le lit avec un lecteur
// natif plutot que dans une iframe, comme on le fait deja pour les images.
export const estFichierVideoDirect = (url: string): boolean => {
  try {
    return new URL(url).hostname === HOTE_FICHIERS;
  } catch {
    return false;
  }
};

export const LecteurVideo: FunctionComponent<{
  src: string;
  titre?: string;
  alignement?: unknown;
  largeur?: unknown;
  className?: string;
}> = ({ src, titre, alignement, largeur, className }) => {
  if (!estUrlHttpSure(src)) return null;

  const classesMiseEnPage = classesMedia({ alignement, largeur });

  if (estFichierVideoDirect(src)) {
    return (
      <video
        className={clsxm(classesMiseEnPage, "rounded", className)}
        controls
        preload="metadata"
        src={src}
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <div
      className={clsxm(
        classesMiseEnPage,
        "aspect-video overflow-hidden rounded",
        className,
      )}
    >
      <iframe
        allowFullScreen
        className="size-full"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        src={sansAutoplay(src)}
        title={titre ?? "Lecteur vidéo"}
      />
    </div>
  );
};
