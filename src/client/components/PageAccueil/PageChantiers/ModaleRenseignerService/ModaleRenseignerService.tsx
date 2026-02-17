import { FunctionComponent, useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Modale } from "@/components/shared/Modale";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import api from "@/server/infrastructure/api/trpc/api";

export const ModaleRenseignerService: FunctionComponent = () => {
  const profil = useProfilUtilisateurConnecte();
  const [variableContenu] =
    api.gestionContenu.recupererVariableContenu.useSuspenseQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_MON_PROFIL",
    });

  const monProfilEstDisponible = variableContenu;
  const [isOpen, setIsOpen] = useState(
    !!monProfilEstDisponible && profil.service == null,
  );

  if (!monProfilEstDisponible || profil.service) {
    return null;
  }

  return (
    <Modale
      onOpenChange={setIsOpen}
      open={isOpen}
      size="sm"
      title="Complétez votre profil"
    >
      <div>
        <p className="fr-text--md fr-mb-4w">
          Renseigner votre profil utilisateur contribue à la clarté des échanges
          et à la lisibilité des actions réalisées sur la plateforme. Nous vous
          invitons à le compléter.
        </p>
        <div className="fr-mt-4w flex justify-end gap-3">
          <Dialog.Close asChild>
            <button
              className="fr-btn fr-btn--secondary"
              title="Fermer la fenêtre modale"
              type="button"
            >
              Plus tard
            </button>
          </Dialog.Close>
          <Link
            className="fr-btn"
            href="/mon-profil-utilisateur"
            title="Accéder à mon profil"
          >
            Compléter mon profil
          </Link>
        </div>
      </div>
    </Modale>
  );
};
