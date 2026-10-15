import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { Button } from "@/components/shared/Button";
import { SearchPicker } from "@/components/shared/SearchPicker";
import { Table } from "@/components/shared/Table";
import { useDebouncedValue } from "@/client/hooks/useDebouncedValue";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

const LONGUEUR_MIN_RECHERCHE = 3;

const MentionProfil = ({ profilNom }: { profilNom: string }) => (
  <span className="text-xs text-dsfr-info-425">
    Déjà autorisé via le profil {profilNom}
  </span>
);

export const AlbertUtilisateurPermissions = () => {
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const rechercheActive = debouncedSearch.length >= LONGUEUR_MIN_RECHERCHE;

  const { data: utilisateurs = [] } =
    api.albertAccess.listUtilisateurs.useQuery();
  const { data: resultats = [], isFetching } =
    api.albertAccess.searchUtilisateurs.useQuery(
      { email: debouncedSearch },
      { enabled: rechercheActive },
    );

  const invalider = () =>
    Promise.all([
      utils.albertAccess.listUtilisateurs.invalidate(),
      utils.albertAccess.searchUtilisateurs.invalidate(),
    ]);

  const addUtilisateur = api.albertAccess.addUtilisateur.useMutation({
    onSuccess: async () => {
      await invalider();
      toast.success("Utilisateur autorisé", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });
  const removeUtilisateur = api.albertAccess.removeUtilisateur.useMutation({
    onSuccess: async () => {
      await invalider();
      toast.success("Accès retiré", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xl">
        <SearchPicker
          emptyLabel={
            rechercheActive
              ? "Aucun utilisateur Pilote ne correspond"
              : `Saisissez au moins ${LONGUEUR_MIN_RECHERCHE} caractères de l'email`
          }
          getKey={(utilisateur) => utilisateur.utilisateurId}
          isItemDisabled={(utilisateur) => utilisateur.dejaAjoute}
          isLoading={rechercheActive && isFetching}
          items={rechercheActive ? resultats : []}
          onSearchChange={setSearch}
          onSelect={(utilisateur) =>
            addUtilisateur.mutate({ utilisateurId: utilisateur.utilisateurId })
          }
          renderItem={(utilisateur) => (
            <span className="flex flex-col gap-1">
              <span>
                {utilisateur.prenom} {utilisateur.nom} · {utilisateur.email} ·{" "}
                {utilisateur.profilNom}
              </span>
              {utilisateur.dejaAjoute ? (
                <span className="text-xs text-dsfr-mention-grey">
                  Déjà dans la liste
                </span>
              ) : utilisateur.autoriseViaProfil ? (
                <MentionProfil profilNom={utilisateur.profilNom} />
              ) : null}
            </span>
          )}
          search={search}
          searchPlaceholder="Rechercher par email"
          triggerLabel="Ajouter un utilisateur…"
        />
      </div>
      {utilisateurs.length === 0 ? (
        <p className="text-dsfr-mention-grey">
          Aucun utilisateur autorisé individuellement
        </p>
      ) : (
        <Table caption="Utilisateurs autorisés individuellement" captionHidden>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <span className="sr-only">Actions</span>
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {utilisateurs.map((utilisateur) => (
              <Table.Row key={utilisateur.utilisateurId}>
                <Table.Cell>
                  {utilisateur.prenom} {utilisateur.nom}
                </Table.Cell>
                <Table.Cell>{utilisateur.email}</Table.Cell>
                <Table.Cell>
                  <span className="flex flex-col items-start gap-1">
                    {utilisateur.profilNom}
                    {utilisateur.autoriseViaProfil ? (
                      <MentionProfil profilNom={utilisateur.profilNom} />
                    ) : null}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    disabled={removeUtilisateur.isPending}
                    onClick={() =>
                      removeUtilisateur.mutate({
                        utilisateurId: utilisateur.utilisateurId,
                      })
                    }
                    size="sm"
                    variant="tertiary"
                  >
                    Retirer
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};
