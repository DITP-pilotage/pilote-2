import type { OIDCConfig } from "next-auth/providers";
import { z } from "zod";
import { configuration } from "@/config";

export const PROVIDER_PROCONNECT = "proconnect";

/**
 * ProConnect ne suit pas la nomenclature OIDC courante : le nom de famille est
 * porté par `usual_name` et non `family_name`.
 *
 * L'email est optionnel ici volontairement : une identité sans email
 * exploitable doit produire un refus lisible côté callback `signIn`, pas une
 * erreur de parsing opaque au milieu du flux OIDC.
 */
export const profilProConnectSchema = z.object({
  sub: z.string().min(1),
  email: z.string().optional(),
  given_name: z.string().optional(),
  usual_name: z.string().optional(),
});

export type ProfilProConnect = z.infer<typeof profilProConnectSchema>;

/**
 * L'endpoint `userinfo` de ProConnect répond en `application/jwt` et non en
 * JSON, contrairement à ce qu'attend Auth.js.
 *
 * On décode le payload sans vérifier la signature : la réponse vient
 * directement de l'émetteur, sur un canal TLS, en échange d'un access token que
 * nous venons d'obtenir. C'est le même niveau de confiance que pour un userinfo
 * JSON standard.
 */
export const decoderPayloadJwt = ({ jwt }: { jwt: string }): unknown => {
  const payload = jwt.split(".")[1];
  if (!payload) {
    throw new Error("Réponse userinfo ProConnect malformée");
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Réponse userinfo ProConnect malformée");
  }
};

/**
 * Le contexte passé au handler `userinfo` est décrit ici plutôt qu'importé :
 * le fichier de déclaration publié par @auth/core référence le type
 * `EndpointHandler` sans jamais le définir ni l'importer, si bien que
 * `UserinfoEndpointHandler` se résout en `any` et n'apporte aucun typage.
 */
type ContexteUserinfo = {
  tokens: { access_token?: string };
  provider: { userinfo?: string | { url?: string | URL } };
};

/**
 * L'URL du userinfo vient de la découverte OIDC : Auth.js la renseigne sur le
 * provider avant d'appeler ce handler.
 */
const recupererProfilProConnect = async ({
  tokens,
  provider,
}: ContexteUserinfo): Promise<ProfilProConnect> => {
  const url =
    typeof provider.userinfo === "string"
      ? provider.userinfo
      : provider.userinfo?.url?.toString();
  if (!url) {
    throw new Error("Endpoint userinfo ProConnect introuvable");
  }

  const reponse = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!reponse.ok) {
    throw new Error(`Appel userinfo ProConnect en échec (${reponse.status})`);
  }

  return profilProConnectSchema.parse(
    decoderPayloadJwt({ jwt: await reponse.text() }),
  );
};

export const proconnect: OIDCConfig<ProfilProConnect> = {
  id: PROVIDER_PROCONNECT,
  name: "ProConnect",
  type: "oidc",
  issuer: configuration().proconnect.issuer,
  clientId: configuration().proconnect.clientId,
  clientSecret: configuration().proconnect.clientSecret,
  authorization: {
    params: { scope: "openid given_name usual_name email" },
  },
  client: { token_endpoint_auth_method: "client_secret_post" },
  // ProConnect exige `state` et `nonce` dans la requête d'autorisation, là où
  // Auth.js n'envoie que `pkce` par défaut. Sans eux, ProConnect répond
  // Y000400 « state must be a string ».
  checks: ["pkce", "state", "nonce"],
  // Sans ceci, Auth.js lit le profil dans l'`id_token` et n'appelle jamais
  // `userinfo`. Or l'id_token ProConnect ne porte pas l'email : c'est le
  // userinfo qui le fournit, et lui seul permet le rapprochement avec un
  // compte PILOTE.
  idToken: false,
  userinfo: { request: recupererProfilProConnect },
  profile(profil) {
    return {
      id: profil.sub,
      email: profil.email ?? null,
      name:
        [profil.given_name, profil.usual_name].filter(Boolean).join(" ") ||
        null,
    };
  },
};
