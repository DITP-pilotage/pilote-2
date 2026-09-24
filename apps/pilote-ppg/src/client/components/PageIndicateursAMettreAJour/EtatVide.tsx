import Link from "next/link";

export const EtatVide = ({
  titre,
  description,
}: {
  titre: string;
  description: string;
}) => (
  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
    <span
      aria-hidden
      className="fr-icon-check-line flex h-16 w-16 items-center justify-center rounded-full bg-dsfr-green-emeraude-975 text-success"
    />
    <h2 className="fr-h5 fr-mb-0">{titre}</h2>
    <p className="fr-mb-0 max-w-xl text-dsfr-mention-grey">{description}</p>
    <Link className="fr-btn fr-btn--secondary" href="/">
      Voir mes chantiers
    </Link>
  </div>
);
