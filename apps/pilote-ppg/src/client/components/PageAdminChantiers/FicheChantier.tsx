import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import Champ from "@/components/_commons/Champ";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import SélecteurPpg from "@/components/PageAdminChantiers/champs/SélecteurPpg";
import SélecteurPerimetre from "@/components/PageAdminChantiers/champs/SélecteurPerimetre";
import SélecteurZonegroup from "@/components/PageAdminChantiers/champs/SélecteurZonegroup";
import MultiSelectPorteursNoDAC from "@/components/PageAdminChantiers/champs/MultiSelectPorteursNoDAC";
import MultiSelectPorteursDAC from "@/components/PageAdminChantiers/champs/MultiSelectPorteursDAC";
import ChampMailleApplicable from "@/components/PageAdminChantiers/champs/ChampMailleApplicable";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const OPTIONS_STATUT = [
  { libellé: "Brouillon", valeur: "BROUILLON" },
  { libellé: "Publié", valeur: "PUBLIE" },
  { libellé: "Archivé", valeur: "ARCHIVE" },
  { libellé: "Supprimé", valeur: "SUPPRIME" },
];

const OPTIONS_ATE = [
  { libellé: "— Aucun —", valeur: "" },
  { libellé: "ATE", valeur: "ate" },
  { libellé: "Hors ATE déconcentré", valeur: "hors_ate_deconcentre" },
  { libellé: "Hors ATE centralisé", valeur: "hors_ate_centralise" },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold text-[#1e1e1e] uppercase tracking-wide border-l-[3px] border-[#000091] pl-3 mb-5">
    {children}
  </h2>
);

const FicheChantier = () => {
  const form = useFormContext<ChantierForm>();
  const chantierId = form.watch("chantierId");

  return (
    <div className="divide-y divide-gray-100">
      <section className="pb-8">
        <SectionTitle>Identification</SectionTitle>
        <div className="flex flex-col gap-4">
          <Champ label="ID chantier" valeur={chantierId} />
          <Textarea<ChantierForm>
            control={form.control}
            name="chNom"
            label="Nom *"
            required
            charLimit={500}
            rows={2}
          />
          <Textarea<ChantierForm>
            control={form.control}
            name="chDescr"
            label="Description"
            rows={4}
          />
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
        <SectionTitle>Porteurs</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <MultiSelectPorteursNoDAC />
          <MultiSelectPorteursDAC />
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
                onChange={field.onChange}
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
              <Sélecteur
                htmlName="chSaisieAte"
                libellé="Type ATE"
                options={OPTIONS_ATE}
                onChange={(val) => field.onChange(val || null)}
                valeurSélectionnée={field.value ?? ""}
              />
            )}
          />
          <Controller
            control={form.control}
            name="chState"
            render={({ field }) => (
              <Sélecteur
                htmlName="chState"
                libellé="Statut *"
                options={OPTIONS_STATUT}
                onChange={field.onChange}
                valeurSélectionnée={field.value}
                erreur={form.formState.errors.chState}
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
          <Input<ChantierForm>
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
