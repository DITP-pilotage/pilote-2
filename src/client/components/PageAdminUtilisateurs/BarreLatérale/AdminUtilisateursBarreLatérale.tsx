import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
import { useSession } from "next-auth/react";
import { FunctionComponent } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import Titre from "@/components/_commons/Titre/Titre";
import { MultiSelectTerritoire } from "@/components/_commons/MultiSelectNew/MultiSelectTerritoire/MultiSelectTerritoire";
import { MultiSelectPérimètreMinistériel } from "@/components/_commons/MultiSelectNew/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel";
import { MultiSelectChantier } from "@/components/_commons/MultiSelectNew/MultiSelectChantier/MultiSelectChantier";
import { Tag } from "@/components/_commons/Tag/Tag";
import { territoiresTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import { MultiSelectProfil } from "@/components/_commons/MultiSelectNew/MultiSelectProfil/MultiSelectProfil";
import {
  AAccesATousLesUtilisateurs,
  PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE,
} from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { Profil } from "@/server/gestion-utilisateur/domain/Profil";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";

interface AdminUtilisateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean;
  setEstOuverteBarreLatérale: (valeur: boolean) => void;
  listeChantiers: ChantierSynthétisé[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[];
  listeProfils: Profil[];
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[];
}

export const AdminUtilisateursBarreLatérale: FunctionComponent<
  AdminUtilisateursBarreLatéraleProps
> = ({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
  listeChantiers,
  listePerimetresMinisteriel,
  listePerimetresMinisterielSelectionnable,
  listeProfils,
  listeTerritoiresSelectionnable,
}) => {
  const { data: session } = useSession();
  const territoires = territoiresTerritoiresStore();

  const profilCréateur = listeProfils?.find(
    (profil) => profil.code === session?.profil,
  );
  const profilAccessibles = AAccesATousLesUtilisateurs(profilCréateur ?? null)
    ? (listeProfils ?? [])
    : listeProfils?.filter((profil) =>
        PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE[
          profilCréateur?.code as keyof typeof PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE
        ].includes(profil.code),
      );

  const [, setPagination] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(20),
    },
    {
      history: "push",
      shallow: false,
    },
  );

  const [filtres, setFiltres] = useQueryStates(
    {
      territoires: parseAsString.withDefault(""),
      perimetresMinisteriels: parseAsString.withDefault(""),
      chantiers: parseAsString.withDefault(""),
      profils: parseAsString.withDefault(""),
    },
    {
      shallow: false,
      clearOnDefault: true,
      history: "push",
    },
  );

  const modifierFiltre = (
    listeValues: string[],
    idFiltre:
      | "territoires"
      | "perimetresMinisteriels"
      | "chantiers"
      | "profils",
  ) => {
    if (
      filtres[idFiltre]
        .split(",")
        .sort()
        .join(",")
        .localeCompare(listeValues.filter(Boolean).sort().join(","))
    ) {
      setPagination({
        pageIndex: 1,
      });
      setFiltres({ [idFiltre]: listeValues.filter(Boolean).join(",") });
    }
  };

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className="fr-mb-2w">
          <MultiSelectTerritoire
            changementValeursSélectionnéesCallback={(territoire) => {
              modifierFiltre(territoire, "territoires");
            }}
            groupesÀAfficher={{
              nationale: listeTerritoiresSelectionnable
                .map((territoire) => territoire.codeInsee)
                .includes("NAT-FR"),
              regionale: true,
              departementale: true,
            }}
            listeTerritoiresSelectionnable={listeTerritoiresSelectionnable}
            territoiresCodesSélectionnésParDéfaut={filtres.territoires.split(
              ",",
            )}
          />
        </div>
        <div className="fr-mb-2w">
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(périmètreMinistériel) => {
              modifierFiltre(périmètreMinistériel, "perimetresMinisteriels");
            }}
            listePerimetresMinisteriel={
              listePerimetresMinisterielSelectionnable
            }
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtres.perimetresMinisteriels.split(
              ",",
            )}
          />
        </div>
        <div className="fr-mb-2w">
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantiers) => {
              modifierFiltre(chantiers, "chantiers");
            }}
            chantiers={listeChantiers ?? []}
            chantiersIdsSélectionnésParDéfaut={filtres.chantiers.split(",")}
          />
        </div>
        <MultiSelectProfil
          changementValeursSélectionnéesCallback={(profil) => {
            modifierFiltre(profil, "profils");
          }}
          profils={profilAccessibles ?? []}
          profilsIdsSélectionnésParDéfaut={filtres.profils.split(",")}
        />
      </BarreLatéraleEncart>
      <div className="fr-px-3w fr-py-2w">
        <Titre baliseHtml="h2" className="fr-h4">
          Filtres actifs
        </Titre>
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() => {
            setFiltres({
              territoires: "",
              chantiers: "",
              profils: "",
              perimetresMinisteriels: "",
            });
          }}
          type="button"
        >
          Réinitialiser les filtres
        </button>
        <button
          aria-controls="fr-sidemenu-item-territoires"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type="button"
        >
          Territoires(s)
        </button>
        <div className="fr-collapse" id="fr-sidemenu-item-territoires">
          {filtres.territoires.split(",").map((territoireCode) => {
            const libellé =
              territoires.find((t) => t.code === territoireCode)?.nomAffiché ??
              null;
            return libellé === null ? null : (
              <Tag
                key={territoireCode}
                libelle={libellé}
                suppressionCallback={() => {
                  const arrFiltre = filtres.territoires.split(",");
                  arrFiltre.splice(arrFiltre.indexOf(territoireCode), 1);
                  modifierFiltre(arrFiltre, "territoires");
                }}
              />
            );
          })}
        </div>
        <button
          aria-controls="fr-sidemenu-item-périmètresMinistériels"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type="button"
        >
          Périmètre(s) ministériel(s)
        </button>
        <div
          className="fr-collapse"
          id="fr-sidemenu-item-périmètresMinistériels"
        >
          {filtres.perimetresMinisteriels
            .split(",")
            .map((perimetreMinisterielId) => {
              let libellé =
                listePerimetresMinisteriel.find(
                  (perimetreMinisteriel) =>
                    perimetreMinisteriel.id === perimetreMinisterielId,
                )?.nom ?? null;
              return libellé === null ? null : (
                <Tag
                  key={perimetreMinisterielId}
                  libelle={libellé}
                  suppressionCallback={() => {
                    const arrFiltre = filtres.perimetresMinisteriels.split(",");
                    arrFiltre.splice(
                      arrFiltre.indexOf(perimetreMinisterielId),
                      1,
                    );
                    modifierFiltre(arrFiltre, "perimetresMinisteriels");
                  }}
                />
              );
            })}
        </div>
        <button
          aria-controls="fr-sidemenu-item-chantiers"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type="button"
        >
          Chantier(s)
        </button>
        <div className="fr-collapse" id="fr-sidemenu-item-chantiers">
          {filtres.chantiers.split(",").map((chantierId) => {
            let libellé =
              listeChantiers?.find(
                (chantierSynthetise) => chantierSynthetise.id === chantierId,
              )?.nom ?? null;
            return libellé === null ? null : (
              <Tag
                key={chantierId}
                libelle={libellé}
                suppressionCallback={() => {
                  const arrFiltre = filtres.chantiers.split(",");
                  arrFiltre.splice(arrFiltre.indexOf(chantierId), 1);
                  modifierFiltre(arrFiltre, "chantiers");
                }}
              />
            );
          })}
        </div>
        <button
          aria-controls="fr-sidemenu-item-profils"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type="button"
        >
          Profil(s)
        </button>
        <div className="fr-collapse" id="fr-sidemenu-item-profils">
          {filtres.profils.split(",").map((profilCode) => {
            let libellé =
              listeProfils?.find((c) => c.code === profilCode)?.nom ?? null;
            return libellé === null ? null : (
              <Tag
                key={profilCode}
                libelle={libellé}
                suppressionCallback={() => {
                  const arrFiltre = filtres.profils.split(",");
                  arrFiltre.splice(arrFiltre.indexOf(profilCode), 1);
                  modifierFiltre(arrFiltre, "profils");
                }}
              />
            );
          })}
        </div>
      </div>
    </BarreLatérale>
  );
};
