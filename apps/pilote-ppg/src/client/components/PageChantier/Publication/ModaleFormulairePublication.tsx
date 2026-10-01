import { ReactNode } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import {
  FormulairePublicationConfiguration,
  Publication,
  ValeursPublication,
} from "@/components/PageChantier/Publication/Publication.interface";
import { ChampsFormulairePublication } from "@/components/PageChantier/Publication/ChampsFormulairePublication";

interface ModaleFormulairePublicationProps<T extends ValeursPublication> {
  title: string;
  consigne: string;
  complementConsigneGenerique: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  commentaire: Publication | null;
  annexe?: ReactNode;
  messageAbsence?: string;
  formulaire: FormulairePublicationConfiguration<T>;
  onPublier: SubmitHandler<T>;
  onEnregistrerBrouillon: SubmitHandler<T>;
}

export const ModaleFormulairePublication = <T extends ValeursPublication>({
  title,
  consigne,
  complementConsigneGenerique,
  trigger,
  open,
  onOpenChange,
  commentaire,
  annexe,
  messageAbsence,
  formulaire,
  onPublier,
  onEnregistrerBrouillon,
}: ModaleFormulairePublicationProps<T>) => {
  const { chantierInformations } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();

  const form = useForm<T>({
    mode: "all",
    resolver: formulaire.resolver,
    defaultValues: formulaire.valeursNouvellePublication,
  });

  return (
    <Modale
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      titleClassName="text-dsfr-grey-50"
      trigger={trigger}
    >
      <p className="text-sm mb-0">
        {chantierInformations.id} {chantierInformations.nom}
      </p>
      <p className="text-sm">{territoireSélectionné.nomAffiché}</p>
      <p className="text-sm text-dsfr-mention-grey mb-6">
        {`Veuillez saisir ci-dessous le nouveau commentaire relatif ${complementConsigneGenerique}. Après publication, le nouveau commentaire sera affiché et l'ancien sera archivé dans l'historique.`}
      </p>
      <h3 className="text-base font-bold mb-3">Commentaire actuel</h3>
      <div className="mb-6">
        <AffichagePublication
          annexe={annexe}
          commentaire={commentaire}
          messageAbsence={messageAbsence}
        />
      </div>

      <h3 className="text-base font-bold mb-3">Votre nouveau commentaire</h3>
      <p className="text-sm mb-6">{consigne}</p>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onPublier)}>
          <ChampsFormulairePublication
            champsAnnexes={formulaire.champsAnnexes}
            classNameEditeur="h-60"
            limiteCaracteres={formulaire.limiteCaracteres}
          />
          <div className="flex justify-end items-center gap-3 mt-6">
            <Bouton
              disabled={!form.formState.isValid}
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
              }
              label="Publier"
              type="submit"
              variant="primary"
            />
            <Bouton
              iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
              label="Annuler"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            />
            <BoutonSousLigné
              disabled={!form.formState.isValid}
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
              }
              onClick={form.handleSubmit(onEnregistrerBrouillon)}
              type="button"
            >
              Enregistrer en tant que brouillon
            </BoutonSousLigné>
          </div>
        </form>
      </FormProvider>
    </Modale>
  );
};
