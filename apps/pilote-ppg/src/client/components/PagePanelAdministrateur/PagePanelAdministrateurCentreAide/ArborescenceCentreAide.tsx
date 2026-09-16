import { FunctionComponent } from "react";
import { ArbreCentreAideDnd } from "@/components/_commons/CentreAide/editeur/ArbreCentreAideDnd";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { Dropdown } from "@/client/components/shared/Dropdown";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

interface ArborescenceCentreAideAdminProps {
  articles: ArticleCentreAideContrat[];
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  onCreerGroupe: (avecContenu: boolean) => void;
  onCreerPage: () => void;
  onDeplacer: (
    id: string,
    cible: { parentId: string | null; index: number },
  ) => void;
  onRenommer: (id: string, titre: string) => void;
}

export const ArborescenceCentreAideAdmin: FunctionComponent<
  ArborescenceCentreAideAdminProps
> = ({
  articles,
  itemSelectionneId,
  onSelectionItem,
  onCreerGroupe,
  onCreerPage,
  onDeplacer,
  onRenommer,
}) => (
  <div className="flex h-full flex-col">
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Bouton
          className="mx-3 mt-3 mb-1 justify-start"
          iconLeft={
            <Icone className="h-4 w-4 !text-current" icone={AddLineIcon} />
          }
          label="Créer"
          size="sm"
          variant="secondary"
        />
      </Dropdown.Trigger>
      <Dropdown.Content align="start" className="w-56">
        <div className="flex flex-col gap-1">
          <Dropdown.Item onSelect={onCreerPage}>Nouvelle page</Dropdown.Item>
          <Dropdown.Item onSelect={() => onCreerGroupe(false)}>
            Nouveau groupe
          </Dropdown.Item>
          <Dropdown.Item onSelect={() => onCreerGroupe(true)}>
            Nouveau groupe avec contenu
          </Dropdown.Item>
        </div>
      </Dropdown.Content>
    </Dropdown.Root>

    <ArbreCentreAideDnd
      articles={articles}
      onDeplacer={onDeplacer}
      onRenommer={onRenommer}
      onSelectionner={onSelectionItem}
      selectionneId={itemSelectionneId}
    />
  </div>
);
