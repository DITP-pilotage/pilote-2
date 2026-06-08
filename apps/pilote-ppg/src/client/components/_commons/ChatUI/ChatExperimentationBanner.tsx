import Link from "next/link";
import { useState } from "react";
import { Callout } from "@/components/shared/Callout";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

const CHARTE_IA_URL =
  "https://docs.numerique.gouv.fr/docs/fa8a98a7-bb77-4c07-9a16-bd80006ee5ec/";

export const ChatExperimentationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Callout.Root color="info" className="relative pr-8 pl-2 py-2">
      <Callout.Icon />
      <Callout.Text>
        <p className="mb-1">
          <span className="font-semibold">Expérimentation en cours</span>
          <span className="mx-3 text-gray-300">|</span>
          <span className="text-sm">
            Ce chatbot est une expérimentation. Vos interactions sont analysées
            pour évaluer sa qualité et sont pseudonymisées.
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-y-1">
          <a
            href={CHARTE_IA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Charte d&apos;utilisation de l&apos;IA dans PILOTE
          </a>
          <span className="mx-3 text-gray-300">|</span>
          <Link
            href="/donnees-personnelles-cookies"
            target="_blank"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Données personnelles et cookies
          </Link>
        </div>
      </Callout.Text>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Masquer le bandeau"
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <CloseLineIcon className="w-4 h-4" fill="currentColor" />
      </button>
    </Callout.Root>
  );
};
