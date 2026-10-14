import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

// Reproduit le lien de téléchargement du DSFR (fr-download) : libellé suivi de l'icône, détail du fichier en dessous.
type DownloadLinkProps = {
  href: string;
  label: ReactNode;
  detail: ReactNode;
  className?: string;
};

export const DownloadLink = ({
  href,
  label,
  detail,
  className,
}: DownloadLinkProps) => (
  <div className={clsxm("relative mb-4 pb-6", className)}>
    <p className="m-0">
      <a
        className="inline max-w-full p-0 text-base font-normal leading-6 text-primary after:-mr-0.5 after:ml-2 after:inline-block after:size-4 after:bg-current after:align-[calc((0.75em-1rem)*0.5)] after:content-[''] after:[mask-image:url(/dsfr/icons/system/download-line.svg)] after:[mask-size:100%_100%]"
        download
        href={href}
      >
        {label}
        <span className="pointer-events-none absolute bottom-0 left-0 max-w-full cursor-text overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal leading-5 text-dsfr-mention-grey">
          {detail}
        </span>
      </a>
    </p>
  </div>
);
