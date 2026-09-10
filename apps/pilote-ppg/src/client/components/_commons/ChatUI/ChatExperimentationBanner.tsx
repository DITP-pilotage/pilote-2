import Link from "next/link";
import { useState } from "react";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

const CHARTE_IA_URL =
  "https://docs.numerique.gouv.fr/docs/fa8a98a7-bb77-4c07-9a16-bd80006ee5ec/";

const LIEN = "whitespace-nowrap font-medium text-primary hover:underline";

export const ChatExperimentationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="flex min-h-9 shrink-0 items-center gap-3 border-t border-dsfr-blue-france-850 bg-dsfr-info-950 px-4 py-1 text-xs leading-[18px] text-dsfr-grey-200">
      <span className="shrink-0 font-bold uppercase tracking-wide text-dsfr-flat-info">
        Expérimentation
      </span>
      <span>
        Ce chatbot est une expérimentation. Vos interactions sont analysées pour
        évaluer sa qualité et sont pseudonymisées.
      </span>
      <a
        className={LIEN}
        href={CHARTE_IA_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        Charte d&apos;utilisation de l&apos;IA dans PILOTE
      </a>
      <Link
        className={LIEN}
        href="/donnees-personnelles-cookies"
        target="_blank"
      >
        Données personnelles et cookies
      </Link>
      <span className="flex-1" />
      <button
        aria-label="Masquer le bandeau"
        className="flex h-7 w-7 shrink-0 items-center justify-center text-dsfr-mention-grey transition-colors hover:bg-white/60 hover:text-dsfr-grey-50"
        onClick={() => setIsVisible(false)}
        type="button"
      >
        <CloseLineIcon className="h-4 w-4" fill="currentColor" />
      </button>
    </div>
  );
};
