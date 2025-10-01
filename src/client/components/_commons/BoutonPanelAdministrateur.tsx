import Link from "next/link";

export const BoutonPanelAdministrateur = () => (
  <Link
    className="!p-0"
    href="/panel-administrateur/parametrage-source-indicateur"
    title="Panel Administrateur"
    type="button"
  >
    Panel administrateur
  </Link>
);
