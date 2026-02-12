import { useCallback, useEffect, useState } from "react";
import {
  ScopeChantiers,
  ScopeUtilisateurs,
} from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { profilsRégionaux } from "@/server/domain/utilisateur/Utilisateur.interface";
import { AAccesATousLesUtilisateurs } from "@/server/domain/utilisateur/profils-gestion-utilisateur";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  listeTerritoires,
  récupérerDétailsSurUnTerritoire,
} from "@/client/constants/territoires";
import FicheUtilisateurProps from "./FicheUtilisateur.interface";

export default function useFicheUtilisateur(
  utilisateur: FicheUtilisateurProps["utilisateur"],
) {
  const { départements } = listeTerritoires;
  const { data: chantiers } =
    api.chantier.recupererTousLesInformationsChantiers.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });
  const { data: profil } = api.profil.récupérer.useQuery(
    { profilCode: utilisateur.profil },
    { staleTime: Number.POSITIVE_INFINITY },
  );

  const [scopes, setScopes] = useState<{
    [key in ScopeChantiers | ScopeUtilisateurs]: {
      chantiers: Chantier["nom"][];
      territoires: Territoire["nomAffiché"][];
    };
  }>({
    lecture: {
      chantiers: [],
      territoires: [],
    },
    saisieIndicateur: {
      chantiers: [],
      territoires: [],
    },
    saisieCommentaire: {
      chantiers: [],
      territoires: [],
    },
    gestionUtilisateur: {
      chantiers: [],
      territoires: [],
    },
    responsabilite: {
      chantiers: [],
      territoires: [],
    },
  });

  const déterminerLesNomÀAfficherPourLesTerritoiresLecture = useCallback(
    (u: FicheUtilisateurProps["utilisateur"]) => {
      if (profil?.code === ProfilEnum.DROM) return ["Ensemble des 5 DROMS"];

      if (profil?.chantiers.lecture.tousTerritoires)
        return ["Tous les territoires"];

      if (profil && profilsRégionaux.includes(profil.code)) {
        const régionsSaisies =
          u?.habilitations?.lecture?.territoires?.filter((territoireCode) =>
            territoireCode.startsWith("REG"),
          ) ?? [];
        const départementsEnfantsDesRégionsSaisies = régionsSaisies.flatMap(
          (régionCode) =>
            départements
              .filter((d) => d.codeParent === régionCode)
              .map((d) => d.nomAffiché),
        );
        const territoireAAfficher = [
          ...régionsSaisies.map(
            (code) => récupérerDétailsSurUnTerritoire(code).nomAffiché,
          ),
          ...départementsEnfantsDesRégionsSaisies,
        ];

        if (u.habilitations?.lecture?.territoires?.includes("NAT-FR")) {
          territoireAAfficher.unshift(
            récupérerDétailsSurUnTerritoire("NAT-FR").nomAffiché,
          );
        }

        return territoireAAfficher;
      }

      return (
        u.habilitations?.lecture?.territoires?.map(
          (territoire) =>
            récupérerDétailsSurUnTerritoire(territoire).nomAffiché,
        ) ?? []
      );
    },
    [départements, profil, récupérerDétailsSurUnTerritoire],
  );

  const déterminerLesNomÀAfficherPourLesChantiersLecture = useCallback(
    (u: FicheUtilisateurProps["utilisateur"]) => {
      if (profil?.code === ProfilEnum.DROM)
        return [
          "Tous les chantiers territorialisés",
          "Tous les chantiers DROM",
        ];

      if (profil?.chantiers.lecture.tous) return ["Tous les chantiers"];

      if (profil?.chantiers.lecture.tousTerritorialisés) {
        return ["Tous les chantiers territorialisés"];
      }

      if (profil?.chantiers.lecture.tousTerritoires) {
        return (
          u.habilitations?.lecture?.chantiers?.map(
            (chantierId) => chantierId,
          ) ?? []
        );
      }

      return (
        u.habilitations?.lecture?.chantiers?.reduce((result, chantierId) => {
          const chantier = chantiers?.find((c) => c.id === chantierId);
          if (
            chantier &&
            u.habilitations?.lecture?.territoires?.some((territoire) =>
              chantier.territoiresApplicables.includes(territoire),
            )
          ) {
            result.push(chantier.id);
          }
          return result;
        }, [] as string[]) ?? []
      );
    },
    [profil, chantiers],
  );

  const déterminerLesNomÀAfficherPourLesChantiersResponsabilite = (
    u: FicheUtilisateurProps["utilisateur"],
  ) => {
    return (
      u.habilitations?.responsabilite?.chantiers?.map(
        (chantierId) => chantierId,
      ) ?? []
    );
  };

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur =
    useCallback(
      (u: FicheUtilisateurProps["utilisateur"]) => {
        return u.saisieIndicateur
          ? déterminerLesNomÀAfficherPourLesTerritoiresLecture(u)
          : [];
      },
      [déterminerLesNomÀAfficherPourLesTerritoiresLecture],
    );

  const déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur = useCallback(
    (u: FicheUtilisateurProps["utilisateur"]) => {
      return u.saisieIndicateur
        ? déterminerLesNomÀAfficherPourLesChantiersLecture(u)
        : [];
    },
    [déterminerLesNomÀAfficherPourLesChantiersLecture],
  );

  const déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire =
    useCallback(
      (u: FicheUtilisateurProps["utilisateur"]) => {
        return u.habilitations?.saisieCommentaire?.chantiers !== undefined &&
          u.habilitations?.saisieCommentaire?.chantiers.length > 0
          ? déterminerLesNomÀAfficherPourLesTerritoiresLecture(u)
          : [];
      },
      [déterminerLesNomÀAfficherPourLesTerritoiresLecture],
    );

  const déterminerLesNomÀAfficherPourLesTerritoiresGestionUtilisateur =
    useCallback(
      (u: FicheUtilisateurProps["utilisateur"]) => {
        if (u.gestionUtilisateur) {
          if (profil?.code === "SECRETARIAT_GENERAL") {
            return ["Tous les départements", "Toutes les régions"];
          }
          return déterminerLesNomÀAfficherPourLesTerritoiresLecture(u);
        }
        return [];
      },
      [déterminerLesNomÀAfficherPourLesTerritoiresLecture, profil],
    );

  const déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire =
    useCallback((u: FicheUtilisateurProps["utilisateur"]) => {
      return (
        u.habilitations?.saisieCommentaire?.chantiers?.map(
          (chantierId) => chantierId,
        ) ?? []
      );
    }, []);

  const déterminerLesNomÀAfficherPourLesChantiersGestionDesUtilisateurs =
    useCallback(
      (u: FicheUtilisateurProps["utilisateur"]) => {
        if (u.gestionUtilisateur) {
          if (AAccesATousLesUtilisateurs(profil ?? null))
            return ["Tous les chantiers"];

          if (
            [
              ProfilEnum.COORDINATEUR_REGION,
              ProfilEnum.COORDINATEUR_DEPARTEMENT,
            ].includes(profil?.code ?? "")
          )
            return ["Tous les chantiers ATE territorialisés"];

          return déterminerLesNomÀAfficherPourLesChantiersLecture(u);
        } else {
          return [];
        }
      },
      [déterminerLesNomÀAfficherPourLesChantiersLecture, profil],
    );

  useEffect(() => {
    if (!chantiers || !profil) return;

    const nouveauScopes = {
      lecture: {
        chantiers:
          déterminerLesNomÀAfficherPourLesChantiersLecture(utilisateur),
        territoires:
          déterminerLesNomÀAfficherPourLesTerritoiresLecture(utilisateur),
      },
      saisieIndicateur: {
        chantiers:
          déterminerLesNomÀAfficherPourLesChantiersSaisieIndicateur(
            utilisateur,
          ),
        territoires:
          déterminerLesNomÀAfficherPourLesTerritoiresSaisieIndicateur(
            utilisateur,
          ),
      },
      saisieCommentaire: {
        chantiers:
          déterminerLesNomÀAfficherPourLesChantiersSaisieCommentaire(
            utilisateur,
          ),
        territoires:
          déterminerLesNomÀAfficherPourLesTerritoiresSaisieCommentaire(
            utilisateur,
          ),
      },
      gestionUtilisateur: {
        chantiers:
          déterminerLesNomÀAfficherPourLesChantiersGestionDesUtilisateurs(
            utilisateur,
          ),
        territoires:
          déterminerLesNomÀAfficherPourLesTerritoiresGestionUtilisateur(
            utilisateur,
          ),
      },
      responsabilite: {
        chantiers:
          déterminerLesNomÀAfficherPourLesChantiersResponsabilite(utilisateur),
        territoires:
          déterminerLesNomÀAfficherPourLesTerritoiresLecture(utilisateur),
      },
    };

    setScopes(nouveauScopes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiers, profil]);

  return {
    scopes,
    chantiers,
  };
}
