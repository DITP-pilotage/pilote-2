import { Controller, useFormContext } from "react-hook-form";
import { FunctionComponent } from "react";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import Champ from "@/components/_commons/Champ";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { OptionsChantierContrat } from "@/server/app/contrats/MetadataChantierContrat";
import { ChantierForm } from "./usePageChantier";

const MAILLES = ["NAT", "REG", "DEPT"] as const;
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

interface FicheChantierProps {
  estEnCoursDeModification: boolean;
  options: OptionsChantierContrat;
  chantierId: string;
}

const FicheChantier: FunctionComponent<FicheChantierProps> = ({
  estEnCoursDeModification,
  options,
  chantierId,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<ChantierForm>();
  const mailleApplicable = watch("mailleApplicable");

  return (
    <div className="flex flex-col gap-8">
      {/* Section Identification */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Identification</h2>
        <div className="grid grid-cols-2 gap-4">
          <Champ label="ID chantier" valeur={chantierId} />
          <Input<ChantierForm>
            control={control}
            name="chNom"
            label="Nom *"
            required
            readOnly={!estEnCoursDeModification}
            charLimit={500}
          />
        </div>
        <div className="mt-4">
          <Textarea<ChantierForm>
            control={control}
            name="chDescr"
            label="Description"
            readOnly={!estEnCoursDeModification}
            rows={4}
          />
        </div>
      </section>

      {/* Section Rattachements */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Rattachements</h2>
        <div className="grid grid-cols-3 gap-4">
          <Controller
            control={control}
            name="chPpg"
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <SélecteurAvecRecherche
                  estVueMobile={false}
                  estVisibleEnMobile
                  htmlName="chPpg"
                  libellé="PPG *"
                  options={options.ppgs.map((p) => ({
                    libellé: `${p.id} — ${p.nom}`,
                    valeur: p.id,
                  }))}
                  valeurModifiéeCallback={field.onChange}
                  valeurSélectionnée={field.value}
                  erreurMessage={errors.chPpg?.message}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="chPer"
            render={({ field }) => (
              <Sélecteur
                htmlName="chPer"
                libellé="Périmètre *"
                options={options.perimetres.map((p) => ({
                  libellé: `${p.id} — ${p.nom}`,
                  valeur: p.id,
                }))}
                onChange={field.onChange}
                valeurSélectionnée={field.value}
                estDesactive={!estEnCoursDeModification}
                erreur={errors.chPer}
              />
            )}
          />
          <Controller
            control={control}
            name="zgApplicable"
            render={({ field }) => (
              <Sélecteur
                htmlName="zgApplicable"
                libellé="Zone group"
                options={[
                  { libellé: "— Aucune —", valeur: "" },
                  ...options.zonegroups.map((z) => ({
                    libellé: `${z.id} — ${z.nom}`,
                    valeur: z.id,
                  })),
                ]}
                onChange={(val) => field.onChange(val || null)}
                valeurSélectionnée={field.value ?? ""}
                estDesactive={!estEnCoursDeModification}
              />
            )}
          />
        </div>
      </section>

      {/* Section Porteurs */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Porteurs</h2>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="porteurIdsNoDAC"
            render={({ field }) => (
              <MultiSelect
                label="Porteurs non-DAC (ministères)"
                suffixeLibellé="ministère(s)"
                optionsGroupées={[
                  {
                    label: "",
                    options: options.porteursMIN.map((p) => ({
                      value: p.id,
                      label: p.label,
                    })),
                  },
                ]}
                valeursSélectionnéesParDéfaut={field.value}
                changementValeursSélectionnéesCallback={field.onChange}
                desactive={!estEnCoursDeModification}
              />
            )}
          />
          <Controller
            control={control}
            name="porteurIdsDAC"
            render={({ field }) => (
              <MultiSelect
                label="Porteurs DAC"
                suffixeLibellé="porteur(s) DAC"
                optionsGroupées={[
                  {
                    label: "",
                    options: options.porteursDac.map((p) => ({
                      value: p.id,
                      label: p.label,
                    })),
                  },
                ]}
                valeursSélectionnéesParDéfaut={field.value}
                changementValeursSélectionnéesCallback={field.onChange}
                desactive={!estEnCoursDeModification}
              />
            )}
          />
        </div>
      </section>

      {/* Section Territorialisation */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Territorialisation</h2>
        <div className="flex flex-col gap-4">
          <Controller
            control={control}
            name="chTerrito"
            render={({ field }) => (
              <Interrupteur
                checked={field.value}
                onChange={field.onChange}
                libellé="Territorialisé"
              />
            )}
          />
          <Controller
            control={control}
            name="mailleApplicable"
            render={({ field, fieldState }) => (
              <div>
                <p className="italic text-xs font-medium mb-2">
                  Maille applicable *
                </p>
                <div className="flex gap-6 items-center flex-wrap">
                  {MAILLES.map((maille) => (
                    <label
                      key={maille}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={field.value.includes(maille)}
                        disabled={!estEnCoursDeModification}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...field.value, maille]
                            : field.value.filter((m) => m !== maille);
                          field.onChange(next);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{maille}</span>
                    </label>
                  ))}
                  {estEnCoursDeModification && (
                    <button
                      type="button"
                      className="text-xs text-blue-600 underline hover:no-underline"
                      onClick={() => field.onChange(["NAT", "REG", "DEPT"])}
                    >
                      Tout sélectionner
                    </button>
                  )}
                  {mailleApplicable.length > 0 && estEnCoursDeModification && (
                    <button
                      type="button"
                      className="text-xs text-gray-500 underline hover:no-underline"
                      onClick={() => field.onChange([])}
                    >
                      Tout désélectionner
                    </button>
                  )}
                </div>
                {fieldState.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </section>

      {/* Section Statut & paramètres */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Statut & paramètres</h2>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="chSaisieAte"
            render={({ field }) => (
              <Sélecteur
                htmlName="chSaisieAte"
                libellé="Type ATE"
                options={OPTIONS_ATE.map((o) => ({
                  libellé: o.libellé,
                  valeur: o.valeur,
                }))}
                onChange={(val) => field.onChange(val || null)}
                valeurSélectionnée={field.value ?? ""}
                estDesactive={!estEnCoursDeModification}
              />
            )}
          />
          <Controller
            control={control}
            name="chState"
            render={({ field }) => (
              <Sélecteur
                htmlName="chState"
                libellé="Statut *"
                options={OPTIONS_STATUT.map((o) => ({
                  libellé: o.libellé,
                  valeur: o.valeur,
                }))}
                onChange={field.onChange}
                valeurSélectionnée={field.value}
                estDesactive={!estEnCoursDeModification}
                erreur={errors.chState}
              />
            )}
          />
          <Controller
            control={control}
            name="chHiddenPilote"
            render={({ field }) => (
              <Interrupteur
                checked={field.value}
                onChange={field.onChange}
                libellé="Masqué dans PILOTE"
              />
            )}
          />
          <Controller
            control={control}
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
            control={control}
            name="conseillerMail"
            label="Mail conseiller"
            type="email"
            readOnly={!estEnCoursDeModification}
          />
        </div>
      </section>
    </div>
  );
};

export default FicheChantier;
