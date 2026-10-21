import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { Button } from "@/components/shared/Button";
import { useSession } from "next-auth/react";
import { FunctionComponent, useRef } from "react";
import { BarreLatérale } from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import {
  AdminUtilisateursFilter,
  useAdminUtilisateursSearchParams,
} from "@/components/PageAdminUtilisateurs/useAdminUtilisateursSearchParams";
import {
  ProfilCode,
  profilsCodes,
} from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { MultiSelectTerritoire } from "@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire";
import { MultiSelectPérimètreMinistériel } from "@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel";
import { MultiSelectChantier } from "@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier";
import { TagDismissible, TagGroup } from "@/components/shared/Tag";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { MultiSelectProfil } from "@/components/_commons/MultiSelect/MultiSelectProfil/MultiSelectProfil";
import {
  AAccesATousLesUtilisateurs,
  PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE,
} from "@/shared/utilisateur/profils-gestion-utilisateur";
import { ChantierSynthétisé } from "@/shared/chantier/Chantier.interface";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { Profil } from "@/shared/profil/Profil.interface";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";
import { listeTerritoires } from "@/client/constants/territoires";

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
  const { territoires } = listeTerritoires;

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

  const {
    params: filtres,
    setFilter,
    resetSidebarFilters,
  } = useAdminUtilisateursSearchParams();

  const modifierFiltre = (
    listeValues: string[],
    idFiltre: Exclude<AdminUtilisateursFilter, "profils" | "typeCompte">,
  ) => setFilter(idFiltre, listeValues.filter(Boolean));

  const modifierFiltreProfils = (listeValues: string[]) =>
    setFilter(
      "profils",
      listeValues.filter((value): value is ProfilCode =>
        (profilsCodes as readonly string[]).includes(value),
      ),
    );

  const activeFiltersHeading = useRef<HTMLHeadingElement>(null);

  const activeFilterSections = [
    {
      title: "Territoire(s)",
      items: filtres.territoires.map((code) => ({
        value: code,
        label: territoires.find((territoire) => territoire.code === code)
          ?.nomAffiché,
      })),
      remove: (value: string) =>
        modifierFiltre(
          filtres.territoires.filter((code) => code !== value),
          "territoires",
        ),
    },
    {
      title: "Périmètre(s) ministériel(s)",
      items: filtres.perimetresMinisteriels.map((id) => ({
        value: id,
        label: listePerimetresMinisteriel.find(
          (perimetreMinisteriel) => perimetreMinisteriel.id === id,
        )?.nom,
      })),
      remove: (value: string) =>
        modifierFiltre(
          filtres.perimetresMinisteriels.filter((id) => id !== value),
          "perimetresMinisteriels",
        ),
    },
    {
      title: "Chantier(s)",
      items: filtres.chantiers.map((id) => ({
        value: id,
        label: listeChantiers.find((chantier) => chantier.id === id)?.nom,
      })),
      remove: (value: string) =>
        modifierFiltre(
          filtres.chantiers.filter((id) => id !== value),
          "chantiers",
        ),
    },
    {
      title: "Profil(s)",
      items: filtres.profils.map((code) => ({
        value: code,
        label: listeProfils.find((profil) => profil.code === code)?.nom,
      })),
      remove: (value: string) =>
        modifierFiltreProfils(filtres.profils.filter((code) => code !== value)),
    },
  ].map((section) => ({
    ...section,
    items: section.items.filter(
      (item): item is { value: string; label: string } =>
        item.label !== undefined,
    ),
  }));
  const hasActiveFilters = activeFilterSections.some(
    (section) => section.items.length > 0,
  );

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className="mb-4">
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
            territoiresCodesSélectionnésParDéfaut={filtres.territoires}
          />
        </div>
        <div className="mb-4">
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(périmètreMinistériel) => {
              modifierFiltre(périmètreMinistériel, "perimetresMinisteriels");
            }}
            listePerimetresMinisteriel={
              listePerimetresMinisterielSelectionnable
            }
            périmètresMinistérielsIdsSélectionnésParDéfaut={
              filtres.perimetresMinisteriels
            }
          />
        </div>
        <div className="mb-4">
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantiers) => {
              modifierFiltre(chantiers, "chantiers");
            }}
            chantiers={listeChantiers ?? []}
            chantiersIdsSélectionnésParDéfaut={filtres.chantiers}
          />
        </div>
        <MultiSelectProfil
          changementValeursSélectionnéesCallback={(profil) => {
            modifierFiltreProfils(profil);
          }}
          profils={profilAccessibles ?? []}
          profilsIdsSélectionnésParDéfaut={filtres.profils}
        />
      </BarreLatéraleEncart>
      <div className="px-6 py-4">
        <h2
          className="text-h6 md:text-h6-md mb-2 focus:outline-none"
          ref={activeFiltersHeading}
          tabIndex={-1}
        >
          Filtres actifs
        </h2>
        <div>
          {activeFilterSections.map((section) => (
            <CollapsibleSection
              contentClassName="pb-3"
              defaultOpen={section.items.length > 0}
              key={`${section.title}-${section.items.length > 0}`}
              title={
                <span>
                  {section.title}{" "}
                  <span className="font-normal text-dsfr-mention-grey">
                    ({section.items.length})
                  </span>
                </span>
              }
              triggerClassName="px-2 data-[state=open]:bg-transparent data-[state=open]:hover:bg-dsfr-grey-1000"
            >
              {section.items.length === 0 ? (
                <p className="mb-0 px-2 text-sm text-dsfr-mention-grey">
                  Aucun filtre
                </p>
              ) : (
                <TagGroup.Root className="px-2">
                  {section.items.map((item) => (
                    <TagGroup.Item key={item.value}>
                      <TagDismissible
                        onClick={() => {
                          section.remove(item.value);
                          activeFiltersHeading.current?.focus();
                        }}
                        size="sm"
                      >
                        {item.label}
                      </TagDismissible>
                    </TagGroup.Item>
                  ))}
                </TagGroup.Root>
              )}
            </CollapsibleSection>
          ))}
        </div>
        <Button
          className="mt-4"
          disabled={!hasActiveFilters}
          iconLeft={
            <Icone
              className="w-4 h-4 text-current rotate-y-180"
              icone={ArrowGoBackIcon}
            />
          }
          onClick={() => {
            resetSidebarFilters();
            activeFiltersHeading.current?.focus();
          }}
          size="sm"
          variant="secondary"
        >
          Réinitialiser les filtres
        </Button>
      </div>
    </BarreLatérale>
  );
};
