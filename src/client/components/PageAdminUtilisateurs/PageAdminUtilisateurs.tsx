import { FunctionComponent, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import TableauAdminUtilisateurs from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs";
import { AdminUtilisateursBarreLatérale } from "@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale";
import "@gouvfr/dsfr/dist/component/select/select.min.css";
import "@gouvfr/dsfr/dist/component/form/form.min.css";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { Profil } from "@/server/gestion-utilisateur/domain/Profil";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";
import { ExportDesDonnees } from "@/components/PageAdminUtilisateurs/ExportDesDonnees/ExportDesDonnees";
import { Icone } from "@/components/_commons/Icone";
import { Success1Icon } from "@/components/_commons/Icones/Success1Icon";

const PageAdminUtilisateurs: FunctionComponent<{
  listeUtilisateurs: UtilisateurListeGestionContrat[];
  nombreUtilisateur: number;
  listeChantiers: ChantierSynthétisé[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[];
  listeProfils: Profil[];
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[];
}> = ({
  listeUtilisateurs,
  nombreUtilisateur,
  listeChantiers,
  listePerimetresMinisteriel,
  listePerimetresMinisterielSelectionnable,
  listeProfils,
  listeTerritoiresSelectionnable,
}) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { data: session } = useSession();

  const donneLaRedirection = () => {
    if (!session) {
      return "/";
    }

    return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(
      session.profil,
    )
      ? "/admin/utilisateur/creer"
      : "/admin/utilisateur/creer/aide";
  };

  return (
    <div className="flex">
      <AdminUtilisateursBarreLatérale
        estOuverteBarreLatérale={estOuverteBarreLatérale}
        listeChantiers={listeChantiers}
        listePerimetresMinisteriel={listePerimetresMinisteriel}
        listePerimetresMinisterielSelectionnable={
          listePerimetresMinisterielSelectionnable
        }
        listeProfils={listeProfils}
        listeTerritoiresSelectionnable={listeTerritoiresSelectionnable}
        setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
      />
      <main>
        <div className="!mt-8 !mb-6 md:!mx-4">
          <div className="fr-grid-row fr-grid-row--middle fr-mb-3w !px-4">
            <div className="fr-col-12 fr-col-md-6">
              <Titre baliseHtml="h1" className="fr-h1 fr-mb-0">
                Gestion des comptes
              </Titre>
            </div>
            <div className="flex justify-end align-center gap-2 w-full">
              <ExportDesDonnees />
              <Link
                className="!bg-primary !bg-none font-medium text-white rounded flex align-center gap-2 !px-4 py-2 no-underline"
                href={donneLaRedirection()}
                title="Créer un compte"
              >
                <Icone className="w-4 h-4 text-current" icone={Success1Icon} />
                Créer un compte
              </Link>
            </div>
          </div>
          <Bloc contenuClassesSupplémentaires="">
            <TableauAdminUtilisateurs
              listeUtilisateurs={listeUtilisateurs}
              nombreUtilisateur={nombreUtilisateur}
            />
          </Bloc>
        </div>
      </main>
    </div>
  );
};

export default PageAdminUtilisateurs;
