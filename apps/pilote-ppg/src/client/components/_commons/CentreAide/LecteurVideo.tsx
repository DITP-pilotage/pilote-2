import { FunctionComponent, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import { classesMedia } from "./alignementMedia";

export const HOTE_FICHIERS = "fichiers.numerique.gouv.fr";
const CHEMIN_MEDIA_FICHIERS = "/media/preview/item/";
const PARAMETRES_AUTOPLAY = ["autoplay", "auto_play", "autostart"];

// Seul ce chemin sert le binaire : les autres adresses de l'hote rendent la page
// du fichier, qu'un lecteur ne sait pas jouer.
export const estUrlMediaFichiers = (url: string): boolean => {
  try {
    const analysee = new URL(url);
    return (
      analysee.hostname === HOTE_FICHIERS &&
      analysee.pathname.startsWith(CHEMIN_MEDIA_FICHIERS)
    );
  } catch {
    return false;
  }
};

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

const IconeLecture: FunctionComponent = () => (
  <svg aria-hidden className="size-6 translate-x-0.5" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
  </svg>
);

export const LecteurVideo: FunctionComponent<{
  src: string;
  titre?: string;
  alignement?: unknown;
  largeur?: unknown;
  className?: string;
}> = ({ src, titre, alignement, largeur, className }) => {
  const [lance, setLance] = useState(false);

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

  const classesCadre = clsxm(
    classesMiseEnPage,
    "aspect-video overflow-hidden rounded",
    className,
  );

  // L'integration n'est montee qu'au clic : la plateforme distante decide seule
  // de demarrer, et toutes les videos d'un article partaient ensemble.
  if (!lance) {
    return (
      <button
        className={clsxm(
          classesCadre,
          "group flex flex-col items-center justify-center gap-3",
          "border border-dsfr-grey-900 bg-dsfr-grey-1000",
        )}
        onClick={() => setLance(true)}
        type="button"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:scale-110">
          <IconeLecture />
        </span>
        <span className="px-4 text-sm text-dsfr-grey-200">
          {titre ?? "Lire la vidéo"}
        </span>
      </button>
    );
  }

  return (
    <div className={classesCadre}>
      <iframe
        allow="fullscreen"
        allowFullScreen
        className="size-full"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        src={sansAutoplay(src)}
        title={titre ?? "Lecteur vidéo"}
      />
    </div>
  );
};
