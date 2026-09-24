import { FormEvent, useState } from "react";
import { Modale } from "@/client/components/shared/Modale";
import {
  estUrlMediaFichiers,
  HOTE_FICHIERS,
} from "@/client/components/_commons/CentreAide/LecteurVideo";

const EXTENSIONS_PAR_TYPE = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
  lien: ["pdf", "xlsx", "ods", "docx", "odt", "csv"],
  video: ["mp4", "webm"],
} as const;

type TypeInsertion = keyof typeof EXTENSIONS_PAR_TYPE;

const DOMAINES_AUTORISES_PAR_TYPE: Partial<Record<TypeInsertion, string[]>> = {
  image: [HOTE_FICHIERS],
  video: ["video.finances.gouv.fr", HOTE_FICHIERS],
};

function extraireIdDepuisUrl(url: string): string | null {
  const match =
    /fichiers\.numerique\.gouv\.fr\/.*\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(
      url,
    );
  return match?.[1] ?? null;
}

function construireUrlMedia(
  identifiant: string,
  nomFichier: string,
  extension: string,
): string {
  const nomFichierEncode = encodeURIComponent(nomFichier);
  return `https://${HOTE_FICHIERS}/media/preview/item/${identifiant}/${nomFichierEncode}.${extension}`;
}

export const ModaleInsertionUrl = ({
  open,
  onOpenChange,
  onValider,
  titre,
  type,
  avecFichiersNumeriques = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValider: (url: string) => void;
  titre: string;
  type: TypeInsertion;
  avecFichiersNumeriques?: boolean;
}) => {
  const [mode, setMode] = useState<"direct" | "constructeur" | "email">(
    "direct",
  );
  const [urlDirecte, setUrlDirecte] = useState("");
  const [urlFichier, setUrlFichier] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const [extension, setExtension] = useState<string>(
    EXTENSIONS_PAR_TYPE[type][0] ?? "",
  );
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");

  const reinitialiser = () => {
    setUrlDirecte("");
    setUrlFichier("");
    setNomFichier("");
    setExtension(EXTENSIONS_PAR_TYPE[type][0] ?? "");
    setEmail("");
    setErreur("");
    setMode("direct");
  };

  const valider = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setErreur("");

    if (mode === "email") {
      if (!email.trim()) {
        setErreur("L'adresse email est requise.");
        return;
      }
      onValider(`mailto:${email.trim()}`);
      reinitialiser();
      onOpenChange(false);
      return;
    }

    if (mode === "direct") {
      const url = urlDirecte.trim();
      if (!url) {
        setErreur("L'URL est requise.");
        return;
      }
      const domainesAutorises = DOMAINES_AUTORISES_PAR_TYPE[type];
      if (domainesAutorises) {
        let hostname: string;
        try {
          hostname = new URL(url).hostname;
        } catch {
          setErreur("L'URL saisie n'est pas valide.");
          return;
        }
        if (!domainesAutorises.some((domaine) => hostname === domaine)) {
          setErreur(`L'URL doit provenir de : ${domainesAutorises.join(", ")}`);
          return;
        }
        // L'adresse qu'on copie depuis l'explorateur ouvre la page du fichier,
        // pas le media : telle quelle elle donne un lecteur vide (PIL-1795).
        if (hostname === HOTE_FICHIERS && !estUrlMediaFichiers(url)) {
          if (!avecFichiersNumeriques || !extraireIdDepuisUrl(url)) {
            setErreur(
              "Cette adresse ne contient pas l'identifiant du fichier. Ouvrez le fichier dans l'explorateur et copiez l'adresse affichée par le navigateur.",
            );
            return;
          }
          setUrlFichier(url);
          setMode("constructeur");
          setErreur(
            "Cette adresse ouvre la page du fichier, pas le média : complétez son nom et son extension ci-dessous.",
          );
          return;
        }
      }
      onValider(url);
    } else {
      const identifiant = extraireIdDepuisUrl(urlFichier);
      if (!identifiant) {
        setErreur(
          "Impossible d'extraire l'identifiant depuis l'URL. Vérifiez le format.",
        );
        return;
      }
      if (!nomFichier.trim()) {
        setErreur("Le nom du fichier est requis.");
        return;
      }
      onValider(construireUrlMedia(identifiant, nomFichier.trim(), extension));
    }

    reinitialiser();
    onOpenChange(false);
  };

  const aDesExtensions = EXTENSIONS_PAR_TYPE[type].length > 0;

  return (
    <Modale
      onOpenChange={(ouvert) => {
        if (!ouvert) reinitialiser();
        onOpenChange(ouvert);
      }}
      open={open}
      size="sm"
      title={titre}
    >
      {(aDesExtensions || type === "lien") && (
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded text-sm border ${mode === "direct" ? "!bg-primary !text-white !border-primary" : "!bg-white !text-dsfr-grey-200 !border-dsfr-grey-900"}`}
            onClick={() => {
              setMode("direct");
              setErreur("");
            }}
            type="button"
          >
            URL directe
          </button>
          {avecFichiersNumeriques && (
            <button
              className={`px-3 py-1 rounded text-sm border ${mode === "constructeur" ? "!bg-primary !text-white !border-primary" : "!bg-white !text-dsfr-grey-200 !border-dsfr-grey-900"}`}
              onClick={() => {
                setMode("constructeur");
                setErreur("");
              }}
              type="button"
            >
              Fichiers numériques
            </button>
          )}
          {type === "lien" && (
            <button
              className={`px-3 py-1 rounded text-sm border ${mode === "email" ? "!bg-primary !text-white !border-primary" : "!bg-white !text-dsfr-grey-200 !border-dsfr-grey-900"}`}
              onClick={() => {
                setMode("email");
                setErreur("");
              }}
              type="button"
            >
              Email
            </button>
          )}
        </div>
      )}

      <form className="flex flex-col gap-3" onSubmit={valider}>
        {mode === "email" ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="email">
              Adresse email
            </label>
            <input
              className="border rounded px-3 py-2 text-sm"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contact@exemple.fr"
              type="email"
              value={email}
            />
          </div>
        ) : mode === "direct" ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="url-directe">
              URL
            </label>
            <input
              className="border rounded px-3 py-2 text-sm"
              id="url-directe"
              onChange={(event) => setUrlDirecte(event.target.value)}
              placeholder="https://..."
              type="url"
              value={urlDirecte}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="url-fichier">
                URL fichiers.numerique.gouv.fr
              </label>
              <input
                className="border rounded px-3 py-2 text-sm"
                id="url-fichier"
                onChange={(event) => setUrlFichier(event.target.value)}
                placeholder="https://fichiers.numerique.gouv.fr/explorer/items/files/..."
                type="url"
                value={urlFichier}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="nom-fichier">
                Nom du fichier exact sur le drive
              </label>
              <input
                className="border rounded px-3 py-2 text-sm"
                id="nom-fichier"
                onChange={(event) => setNomFichier(event.target.value)}
                placeholder={type === "video" ? "ma_video" : "mon_image"}
                type="text"
                value={nomFichier}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="extension">
                Extension
              </label>
              <select
                className="border rounded px-3 py-2 text-sm"
                id="extension"
                onChange={(event) => setExtension(event.target.value)}
                value={extension}
              >
                {EXTENSIONS_PAR_TYPE[type].map((ext) => (
                  <option key={ext} value={ext}>
                    .{ext}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <button
          className="self-end px-4 py-2 rounded text-sm !bg-primary !text-white"
          type="submit"
        >
          Insérer
        </button>
      </form>
    </Modale>
  );
};
