import { ComponentType, FunctionComponent } from "react";
import { EditeurCentreAide } from "@/components/_commons/CentreAide/editeur/EditeurCentreAide";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Book2ContourIcon } from "@/components/_commons/Icones/Book2ContourIcon";
import { FileTextIcon } from "@/components/_commons/Icones/FileTextIcon";
import { Dropdown } from "@/client/components/shared/Dropdown";
import { clsxm } from "@/utils/clsxm";
import { ArborescenceCentreAideAdmin } from "./ArborescenceCentreAide";
import { useEditionCentreAide } from "./useEditionCentreAide";

// Largeur utile de la colonne d'article dans PageCentreAidePilote :
// max-w-screen-xl (1280) - px-6 (48) - menu (280) - gap-4 (16) - p-6 (48).
// L'éditeur s'y aligne pour que la saisie soit fidèle à la lecture.
const LARGEUR_COLONNE_LECTURE = "max-w-[888px]";

const EtatPublication: FunctionComponent<{
  estPublie: boolean;
  estMasque: boolean;
  aDesModificationsNonPubliees: boolean;
}> = ({ estPublie, estMasque, aDesModificationsNonPubliees }) => {
  const [couleur, libelle] = estMasque
    ? ["bg-dsfr-grey-625", "Masqué"]
    : !estPublie
      ? ["bg-dsfr-moutarde-main-679", "Brouillon"]
      : aDesModificationsNonPubliees
        ? ["bg-dsfr-warning-425", "Modifications non publiées"]
        : ["bg-dsfr-success-425", "Publié"];

  return (
    <span className="flex items-center gap-2 text-[13px] text-dsfr-grey-50">
      <span aria-hidden className={clsxm("size-1.5 rounded-full", couleur)} />
      {libelle}
    </span>
  );
};

const CarteAction: FunctionComponent<{
  icone: ComponentType<{ className: string; fill: string }>;
  label: string;
  onClick: () => void;
}> = ({ icone, label, onClick }) => (
  <button
    className="flex min-h-[76px] flex-col items-start gap-2 border border-dsfr-grey-900 bg-white p-3.5 text-left text-sm leading-5 font-medium text-dsfr-grey-50 transition-colors hover:border-primary hover:bg-dsfr-alt-blue-france hover:text-primary"
    onClick={onClick}
    type="button"
  >
    <Icone className="h-4 w-4 !text-primary" icone={icone} />
    {label}
  </button>
);

export const PagePanelAdministrateurCentreAide: FunctionComponent = () => {
  const {
    articles,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    creerGroupe,
    creerPage,
    estChargement,
    titreAffiche,
    setTitreAffiche,
    contenu,
    setContenu,
    sauvegarder,
    supprimer,
    publier,
    basculerVisibilite,
    deplacerArticle,
    renommerArticle,
    aDesModificationsNonPubliees,
    aDesModificationsNonEnregistrees,
  } = useEditionCentreAide();

  if (estChargement) {
    return (
      <p className="py-12 text-center text-sm text-dsfr-mention-grey">
        Chargement…
      </p>
    );
  }

  const afficherEditeur = itemSelectionne !== undefined;
  const aContenu = contenu !== null;
  const estConsultable =
    itemSelectionne?.estPublie === true && !itemSelectionne.estMasque;

  return (
    <div className="flex h-[calc(100dvh-120px)] overflow-hidden border border-dsfr-grey-900 bg-white">
      <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-dsfr-grey-900">
        <ArborescenceCentreAideAdmin
          articles={articles}
          itemSelectionneId={itemSelectionneId}
          onCreerGroupe={creerGroupe}
          onCreerPage={creerPage}
          onDeplacer={deplacerArticle}
          onRenommer={renommerArticle}
          onSelectionItem={selectionnerItem}
        />
      </aside>

      {afficherEditeur ? (
        <section
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
          key={itemSelectionneId}
        >
          <header className="flex items-center justify-between gap-6 border-b border-dsfr-grey-900 px-8 py-3">
            <EtatPublication
              aDesModificationsNonPubliees={aDesModificationsNonPubliees}
              estMasque={itemSelectionne?.estMasque ?? false}
              estPublie={itemSelectionne?.estPublie ?? false}
            />

            <div className="flex items-center gap-4">
              {aDesModificationsNonEnregistrees ? (
                <Bouton
                  label="Enregistrer"
                  onClick={sauvegarder}
                  size="sm"
                  variant="link"
                />
              ) : (
                <span className="text-[13px] text-dsfr-mention-grey">
                  Enregistré
                </span>
              )}

              <Bouton
                disabled={
                  !aDesModificationsNonPubliees &&
                  itemSelectionne?.estPublie === true
                }
                label="Publier"
                onClick={publier}
                size="sm"
                variant="primary"
              />

              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <button
                    aria-label="Autres actions"
                    className="flex size-8 items-center justify-center text-dsfr-grey-50 transition-colors hover:bg-dsfr-alt-blue-france hover:text-primary"
                    type="button"
                  >
                    <span aria-hidden className="text-base leading-none">
                      ⋯
                    </span>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Content align="end" className="w-60">
                  <div className="flex flex-col gap-1">
                    <Dropdown.Item asChild disabled={!estConsultable}>
                      <a
                        className={clsxm(
                          !estConsultable && "pointer-events-none opacity-40",
                        )}
                        href={`/centre-aide-pilote?article=${itemSelectionneId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Voir dans le centre d&apos;aide
                      </a>
                    </Dropdown.Item>
                    <Dropdown.Item onSelect={basculerVisibilite}>
                      {itemSelectionne?.estMasque
                        ? "Rendre visible"
                        : "Masquer du centre d'aide"}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      className="text-error hover:!bg-dsfr-warning-950"
                      onSelect={supprimer}
                    >
                      Supprimer définitivement
                    </Dropdown.Item>
                  </div>
                </Dropdown.Content>
              </Dropdown.Root>
            </div>
          </header>

          {aContenu ? (
            <div className="flex-1 overflow-y-auto px-8 pb-24">
              <div className={clsxm("mx-auto w-full", LARGEUR_COLONNE_LECTURE)}>
                <input
                  aria-label="Titre de l'article"
                  className="w-full border-none bg-transparent pt-8 pb-4 text-[26px] leading-8 font-bold text-dsfr-grey-50 outline-none placeholder:text-dsfr-grey-900"
                  onChange={(event) => setTitreAffiche(event.target.value)}
                  placeholder="Titre de l'article"
                  type="text"
                  value={titreAffiche}
                />
                <EditeurCentreAide contenu={contenu} onChange={setContenu} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <Icone
                className="h-6 w-6 !text-dsfr-grey-625"
                icone={Book2ContourIcon}
              />
              <p className="text-[15px] leading-6 text-dsfr-mention-grey fr-mb-0">
                Ce groupe range des articles. Il n&apos;a pas de contenu à
                rédiger.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-7 px-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-[26px] leading-8 font-bold text-dsfr-grey-50 fr-mb-0">
              Le centre d&apos;aide de PILOTE
            </h2>
            <p className="text-[15px] leading-6 text-dsfr-mention-grey fr-mb-0">
              Rédigez les articles tels qu&apos;ils s&apos;afficheront, puis
              publiez-les. Choisissez un article à gauche, ou commencez ici.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <CarteAction
              icone={FileTextIcon}
              label="Nouvelle page"
              onClick={creerPage}
            />
            <CarteAction
              icone={Book2ContourIcon}
              label="Nouveau groupe"
              onClick={() => creerGroupe(false)}
            />
          </div>
        </section>
      )}
    </div>
  );
};
