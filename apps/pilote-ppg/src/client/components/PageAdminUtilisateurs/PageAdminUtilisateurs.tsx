import { FunctionComponent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import TableauAdminUtilisateurs from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs";
import Alerte from "@/client/components/_commons/Alerte/Alerte";
import AlerteProps from "@/client/components/_commons/Alerte/Alerte.interface";
import { AdminUtilisateursBarreLatérale } from "@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { ChantierSynthétisé } from "@/shared/chantier/Chantier.interface";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { Profil } from "@/shared/profil/Profil.interface";
import type { UtilisateursPage } from "@/server/gestion-utilisateur/usecases/ListUtilisateursPageUseCase";
import { api } from "@/server/framework/trpc/api";
import { keepPreviousData } from "@tanstack/react-query";
import { useAdminUtilisateursSearchParams } from "@/components/PageAdminUtilisateurs/useAdminUtilisateursSearchParams";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";
import { ExportDesDonnees } from "@/components/PageAdminUtilisateurs/ExportDesDonnees/ExportDesDonnees";
import { Icone } from "@/components/_commons/Icone";
import { Success1Icon } from "@/components/_commons/Icones/Success1Icon";

const PageAdminUtilisateurs: FunctionComponent<{
  initialPage: UtilisateursPage;
  listeChantiers: ChantierSynthétisé[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[];
  listeProfils: Profil[];
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[];
}> = ({
  initialPage,
  listeChantiers,
  listePerimetresMinisteriel,
  listePerimetresMinisterielSelectionnable,
  listeProfils,
  listeTerritoiresSelectionnable,
}) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { params } = useAdminUtilisateursSearchParams();
  const utils = api.useUtils();
  useState(() => utils.utilisateur.list.setData(params, initialPage));
  const { data: utilisateursPage = initialPage } =
    api.utilisateur.list.useQuery(params, {
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    });

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

  useEffect(() => {
    if (router.query["compteCréé"]) {
      setAlerte({
        titre: "Bravo, le compte a bien été créé !",
        type: "succès",
        message: "Un mail lui a été envoyé pour définir son mot de passe.",
      });
    }

    if (router.query["compteModifié"]) {
      setAlerte({
        titre: "Bravo, le compte a bien été modifié !",
        type: "succès",
      });
    }

    if (router.query["compteRéactivé"]) {
      setAlerte({
        titre: "Bravo, le compte a bien été réactivé !",
        type: "succès",
      });
    }

    if (router.query["compteDésactivé"]) {
      setAlerte({
        titre: "Le compte a bien été désactivé.",
        type: "succès",
      });
      window.scroll(0, 0);
    }
  }, [router]);

  return (
    <div className="flex grow">
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
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        {alerte ? (
          <div>
            <Alerte
              message={alerte.message}
              titre={alerte.titre}
              type={alerte.type}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-h1 md:text-h1-md mb-0">Gestion des comptes</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ExportDesDonnees />
            <Link
              className="bg-primary bg-none font-medium text-white rounded flex items-center gap-2 px-4 py-2 no-underline"
              href={donneLaRedirection()}
              title="Créer un compte"
            >
              <Icone className="w-4 h-4 text-current" icone={Success1Icon} />
              Créer un compte
            </Link>
          </div>
        </div>
        <Bloc className="flex-1" contenuClassesSupplémentaires="p-4 md:p-6">
          <TableauAdminUtilisateurs
            listeUtilisateurs={utilisateursPage.utilisateurs}
            nombreUtilisateur={utilisateursPage.total}
          />
        </Bloc>
      </main>
    </div>
  );
};

export default PageAdminUtilisateurs;
