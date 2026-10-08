import { Controller } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField } from "@/components/shared/TextField";
import { SelectField } from "@/components/shared/SelectField";
import { Button } from "@/components/shared/Button";
import { CheckboxField } from "@/components/shared/Checkbox";
import { FunctionComponent } from "react";
import {
  MultiSelectTerritoire,
  MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT,
  MAXIMUM_COMPTES_AUTORISE_PAR_REGION,
} from "@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire";
import { MultiSelectPérimètreMinistériel } from "@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel";
import { UtilisateurFormulaireProps } from "@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";
import { MultiSelectChantier } from "@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { SelecteurApplication } from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SelecteurApplication";
import { SelectServiceAdmin } from "@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SelectServiceAdmin";
import useSaisieDesInformationsUtilisateur from "./useSaisieDesInformationsUtilisateur";

const SaisieDesInformationsUtilisateur: FunctionComponent<
  UtilisateurFormulaireProps
> = ({ utilisateur, estAutoriseAVoirLeSelecteurApplication }) => {
  const {
    register,
    control,
    getValues,
    setValue,
    errors,
    optionsProfil,
    profilCodeSelectionne,
    changementProfilSelectionne,
    afficherChampLectureTerritoires,
    activerLaRestrictionDesTerritoires,
    groupesTerritoiresÀAfficher,
    territoiresSélectionnables,
    changementTerritoiresSelectionnes,
    afficherChampLecturePérimètres,
    changementPerimetresSelectionnes,
    afficherChampLectureChantiers,
    chantiersAccessiblesLecture,
    chantiersIdsAppartenantsAuxPerimetresSelectionnes,
    changementChantiersSelectionnes,
    afficherChampResponsabiliteChantiers,
    chantiersAccessibleResponsabilite,
    afficherChampSaisieIndicateur,
    afficherChampGestionCompte,
    afficherChampSaisieCommentaire,
    perimetresSelectionnables,
    chantiersAccessibleSaisieCommentaire,
    watch,
  } = useSaisieDesInformationsUtilisateur();

  const service = watch("service");

  return (
    <>
      <p>
        Il existe trois types de droits : les droits de lecture, les droits de
        saisie des données et les droits de saisie des commentaires. Des droits
        sont attribués par défaut selon le profil. Pour les profils n'ayant
        accès qu'à certains territoires ou chantiers, il faut spécifier lesquels
        dans la partie “périmètre”. Pour certains profils, les droits de saisie
        sont facultatifs et à préciser.
      </p>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="mb-2 text-lg">Identification</h2>
          <p className="text-xs text-dsfr-mention-grey mb-8">
            Tous les champs sont obligatoires.
          </p>
        </div>
        {estAutoriseAVoirLeSelecteurApplication ? (
          <SelecteurApplication />
        ) : null}
      </div>
      <TextField
        className={FIELD_GROUP_SPACING}
        disabled={Boolean(utilisateur?.email)}
        errorMessage={errors.email?.message?.toString()}
        id="email"
        label="Adresse électronique"
        hint="Format attendu : nom@domaine.fr"
        type="email"
        {...register("email")}
      />
      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={errors.nom?.message?.toString()}
        id="nom"
        label="Nom"
        {...register("nom")}
      />
      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={errors.prénom?.message?.toString()}
        id="prénom"
        label="Prénom"
        {...register("prénom")}
      />
      <SelectServiceAdmin />
      {service === "autre" && (
        <div className="fr-mb-4w">
          <TextField
            className="mb-2"
            id="serviceAutre"
            label="Précisez votre service"
            errorMessage={errors.serviceAutre?.message?.toString()}
            type="text"
            {...register("serviceAutre")}
          />
        </div>
      )}
      <TextField
        className={FIELD_GROUP_SPACING}
        errorMessage={errors.fonction?.message?.toString()}
        id="fonction"
        label="Fonction"
        {...register("fonction")}
      />
      <SelectField
        className={FIELD_GROUP_SPACING}
        errorMessage={errors.profil?.message?.toString()}
        name="profil"
        label="Profil"
        onChange={changementProfilSelectionne}
        options={optionsProfil}
        hint="Les droits attribués dépendent du profil sélectionné."
        placeholder="Sélectionner un profil"
        value={profilCodeSelectionne}
      />
      <div
        className={`${afficherChampLectureTerritoires || afficherChampLecturePérimètres || afficherChampLectureChantiers ? "" : "fr-hidden"}`}
      >
        <hr className="fr-hr" />
        <h2 className="text-base mb-4">Droits de lecture</h2>
        <p className="fr-text--xs text-dsfr-mention-grey fr-mb-4w">
          {`Afin de paramétrer l'espace Pilote, merci de préciser le périmètre auquel se rattache le compte. Les options disponibles dépendent du profil indiqué.
             Le nombre d'utilisateurs est limité à ${MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT} comptes à la maille départementale et ${MAXIMUM_COMPTES_AUTORISE_PAR_REGION} comptes à la maille régionale.`}
        </p>
        <div
          className={`${afficherChampLectureTerritoires ? "" : "fr-hidden"}`}
        >
          <div className="fr-mb-4w">
            <Controller
              control={control}
              name="habilitations.lecture.territoires"
              render={() => (
                <MultiSelectTerritoire
                  activerLaRestrictionDesTerritoires={
                    activerLaRestrictionDesTerritoires
                  }
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={
                    changementTerritoiresSelectionnes
                  }
                  groupesÀAfficher={groupesTerritoiresÀAfficher}
                  territoiresCodesSélectionnésParDéfaut={getValues(
                    "habilitations.lecture.territoires",
                  )}
                  listeTerritoiresSelectionnable={territoiresSélectionnables}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div className={`${afficherChampLecturePérimètres ? "" : "fr-hidden"}`}>
          <div className="fr-mb-4w">
            <Controller
              control={control}
              name="habilitations.lecture.périmètres"
              render={() => (
                <MultiSelectPérimètreMinistériel
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={
                    changementPerimetresSelectionnes
                  }
                  desactive={perimetresSelectionnables.length === 0}
                  listePerimetresMinisteriel={perimetresSelectionnables}
                  périmètresMinistérielsIdsSélectionnésParDéfaut={getValues(
                    "habilitations.lecture.périmètres",
                  )}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div className={`${afficherChampLectureChantiers ? "" : "fr-hidden"}`}>
          <div className="fr-mb-4w">
            <Controller
              control={control}
              name="habilitations.lecture.chantiers"
              render={() => (
                <MultiSelectChantier
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={
                    changementChantiersSelectionnes
                  }
                  chantiers={chantiersAccessiblesLecture ?? []}
                  chantiersIdsSélectionnésParDéfaut={getValues(
                    "habilitations.lecture.chantiers",
                  )}
                  valeursDésactivées={
                    chantiersIdsAppartenantsAuxPerimetresSelectionnes
                  }
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div
          className={`${afficherChampResponsabiliteChantiers ? "" : "fr-hidden"}`}
        >
          <hr className="fr-hr" />
          <h2 className="text-base mb-4">Responsabilités</h2>
          <p className="fr-text--xs text-dsfr-mention-grey fr-mb-4w">
            Parmi les chantiers autorisés en lecture, merci d'indiquer ceux pour
            lesquels l'utilisateur a des responsabilités spécifiques (directeur
            de projet ou responsable local). L'utilisateur apparaîtra
            nominativement comme directeur de projet ou responsable local de ces
            chantiers sur les pages des chantiers concernés dans PILOTE
          </p>
          <div className="fr-mb-4w">
            <Controller
              control={control}
              name="habilitations.responsabilite.chantiers"
              render={() => (
                <MultiSelectChantier
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={(
                    valeursSélectionnées,
                  ) =>
                    setValue(
                      "habilitations.responsabilite.chantiers",
                      valeursSélectionnées,
                    )
                  }
                  chantiers={chantiersAccessibleResponsabilite}
                  chantiersIdsSélectionnésParDéfaut={getValues(
                    "habilitations.responsabilite.chantiers",
                  )}
                  desactive={chantiersAccessibleResponsabilite.length === 0}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
      </div>
      <div className={`${afficherChampSaisieIndicateur ? "" : "fr-hidden"}`}>
        <hr className="fr-hr" />
        <h2 className="text-base mb-4">
          Droits de saisie des données quantitatives
        </h2>
        <Controller
          control={control}
          name="saisieIndicateur"
          render={({ field }) => (
            <CheckboxField
              checked={field.value}
              className="mb-4 px-2"
              label="Accorder les droits de saisie des données quantitatives"
              name={field.name}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
      </div>
      <div className={`${afficherChampSaisieCommentaire ? "" : "fr-hidden"}`}>
        <hr className="fr-hr" />
        <h2 className="text-base mb-4">Droits de saisie des commentaires</h2>
        <p className="fr-text--xs text-dsfr-mention-grey fr-mb-4w">
          Parmi les chantiers autorisés en lecture, merci d'indiquer, le cas
          échéant, ceux pour lesquels l'utilisateur est autorisé à saisir des
          commentaires qualitatifs (dont la météo et la synthèse des résultats).
        </p>
        <Controller
          control={control}
          name="habilitations.saisieCommentaire.chantiers"
          render={() => (
            <MultiSelectChantier
              afficherBoutonsSélection
              changementValeursSélectionnéesCallback={(valeursSélectionnées) =>
                setValue(
                  "habilitations.saisieCommentaire.chantiers",
                  valeursSélectionnées,
                )
              }
              chantiers={chantiersAccessibleSaisieCommentaire}
              chantiersIdsSélectionnésParDéfaut={getValues(
                "habilitations.saisieCommentaire.chantiers",
              )}
              desactive={chantiersAccessibleSaisieCommentaire.length === 0}
            />
          )}
          rules={{ required: true }}
        />
      </div>
      <div className={`${afficherChampGestionCompte ? "" : "fr-hidden"}`}>
        <hr className="fr-hr" />
        <h2 className="text-base mb-4">
          Droits de gestion des comptes utilisateurs
        </h2>
        <Controller
          control={control}
          name="gestionUtilisateur"
          render={({ field }) => (
            <CheckboxField
              checked={field.value}
              className="mb-4 px-2"
              label="Accorder les droits de gestion des comptes utilisateurs"
              name={field.name}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
      </div>
      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
        <Button
          iconRight={
            <Icone className="text-current h-4 w-4" icone={ArrowLine1Icon} />
          }
          title="Suivant"
          type="submit"
        >
          Suivant
        </Button>
      </div>
    </>
  );
};

export default SaisieDesInformationsUtilisateur;
