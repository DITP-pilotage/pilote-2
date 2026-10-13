import { Controller, useFormContext } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import {
  FormTextField,
  FormTextareaField,
} from "@/components/shared/FormTextField";
import {
  SelectField,
  type SelectFieldOption,
} from "@/components/shared/SelectField";
import { $Enums } from "@prisma/client";
import Champ from "@/components/_commons/Champ";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import SélecteurPpg from "@/components/PageAdminChantiers/champs/SélecteurPpg";
import SélecteurPerimetre from "@/components/PageAdminChantiers/champs/SélecteurPerimetre";
import SélecteurZonegroup from "@/components/PageAdminChantiers/champs/SélecteurZonegroup";
import SélecteurPorteurPrincipal from "@/components/PageAdminChantiers/champs/SélecteurPorteurPrincipal";
import { MultiSelectPorteursSecondaires } from "@/components/PageAdminChantiers/champs/MultiSelectPorteursSecondaires";
import { MultiSelectPorteursDAC } from "@/components/PageAdminChantiers/champs/MultiSelectPorteursDAC";
import ChampMailleApplicable from "@/components/PageAdminChantiers/champs/ChampMailleApplicable";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";
import { Maille } from "@/server/parametrage-chantier/domain/maille";
import { SectionTitle } from "@/components/shared/SectionTitle";

const OPTIONS_STATUT: SelectFieldOption<$Enums.type_statut>[] = [
  { libelle: "Brouillon", valeur: "BROUILLON" },
  { libelle: "Publié", valeur: "PUBLIE" },
  { libelle: "Archivé", valeur: "ARCHIVE" },
  { libelle: "Supprimé", valeur: "SUPPRIME" },
];

const OPTIONS_ATE: SelectFieldOption<$Enums.type_ate | "">[] = [
  { libelle: "— Aucun —", valeur: "" },
  { libelle: "ATE", valeur: "ate" },
  { libelle: "Hors ATE déconcentré", valeur: "hors_ate_deconcentre" },
  { libelle: "Hors ATE centralisé", valeur: "hors_ate_centralise" },
];

function maillesAttendues(
  chTerrito: boolean,
  mailleApplicable: readonly Maille[],
): Maille[] {
  if (!chTerrito) return ["NAT"];
  return mailleApplicable.includes("DEPT")
    ? ["NAT", "REG", "DEPT"]
    : ["NAT", "REG"];
}

const FicheChantier = () => {
  const form = useFormContext<ChantierForm>();
  const chantierId = form.watch("chantierId");

  return (
    <div className="divide-y divide-gray-100">
      <section className="pb-8">
        <SectionTitle>Identification</SectionTitle>
        <div className="flex flex-col gap-4">
          <Champ label="ID chantier" valeur={chantierId} />
          <FormTextareaField<ChantierForm>
            control={form.control}
            name="chNom"
            label="Nom"
            required
            charLimit={500}
            rows={2}
          />
          <FormTextareaField<ChantierForm>
            control={form.control}
            name="chDescr"
            label="Description"
            rows={4}
          />
        </div>
      </section>

      <section className="py-8">
        <SectionTitle>Porteurs</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <SélecteurPorteurPrincipal />
          <MultiSelectPorteursSecondaires />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <MultiSelectPorteursDAC />
        </div>
      </section>

      <section className="py-8">
        <SectionTitle>Rattachements</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <SélecteurPpg />
          <SélecteurPerimetre />
          <SélecteurZonegroup />
        </div>
      </section>

      <section className="py-8">
        <SectionTitle>Territorialisation</SectionTitle>
        <div className="flex flex-col gap-4">
          <Controller
            control={form.control}
            name="chTerrito"
            render={({ field }) => (
              <Interrupteur
                checked={field.value}
                onChange={(checked) => {
                  field.onChange(checked);
                  form.setValue(
                    "mailleApplicable",
                    maillesAttendues(
                      checked,
                      form.getValues("mailleApplicable"),
                    ),
                    { shouldValidate: true },
                  );
                }}
                libellé="Territorialisé"
              />
            )}
          />
          <ChampMailleApplicable />
        </div>
      </section>

      <section className="pt-8">
        <SectionTitle>Statut & paramètres</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="chSaisieAte"
            render={({ field }) => (
              <SelectField
                className={FIELD_GROUP_SPACING}
                name="chSaisieAte"
                label="Type ATE"
                options={OPTIONS_ATE}
                onChange={(val) => field.onChange(val || null)}
                value={field.value ?? ""}
              />
            )}
          />
          <Controller
            control={form.control}
            name="chState"
            render={({ field }) => (
              <SelectField
                className={FIELD_GROUP_SPACING}
                name="chState"
                label="Statut *"
                options={OPTIONS_STATUT}
                onChange={field.onChange}
                value={field.value}
                errorMessage={form.formState.errors.chState?.message?.toString()}
              />
            )}
          />
          <Controller
            control={form.control}
            name="chCibleAttendue"
            render={({ field }) => (
              <Interrupteur
                checked={field.value}
                onChange={field.onChange}
                libellé="Cible attendue"
              />
            )}
          />
        </div>
        <div className="mt-4">
          <FormTextField<ChantierForm>
            control={form.control}
            name="conseillerMail"
            label="Mail conseiller"
            type="email"
          />
        </div>
      </section>
    </div>
  );
};

export default FicheChantier;
