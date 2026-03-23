import { FormEvent, useState } from "react";
import { Modale } from "@/client/components/shared/Modale";

const EXTENSIONS_PAR_TYPE = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
  lien: ["pdf", "xlsx", "ods", "docx", "odt", "csv"],
} as const;

type TypeInsertion = keyof typeof EXTENSIONS_PAR_TYPE;

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
  return `https://fichiers.numerique.gouv.fr/media/preview/item/${identifiant}/${nomFichier}.${extension}`;
}

export const ModaleInsertionUrl = ({
  open,
  onOpenChange,
  onValider,
  titre,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValider: (url: string) => void;
  titre: string;
  type: TypeInsertion;
}) => {
  const [mode, setMode] = useState<"direct" | "constructeur">("direct");
  const [urlDirecte, setUrlDirecte] = useState("");
  const [urlFichier, setUrlFichier] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const [extension, setExtension] = useState<string>(
    EXTENSIONS_PAR_TYPE[type][0],
  );
  const [erreur, setErreur] = useState("");

  const reinitialiser = () => {
    setUrlDirecte("");
    setUrlFichier("");
    setNomFichier("");
    setExtension(EXTENSIONS_PAR_TYPE[type][0]);
    setErreur("");
    setMode("direct");
  };

  const valider = (event: FormEvent) => {
    event.preventDefault();
    setErreur("");

    if (mode === "direct") {
      if (!urlDirecte.trim()) {
        setErreur("L'URL est requise.");
        return;
      }
      onValider(urlDirecte.trim());
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
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded text-sm border ${mode === "direct" ? "!bg-[#000091] !text-white !border-[#000091]" : "!bg-white !text-[#3a3a3a] !border-[#ddd]"}`}
          onClick={() => {
            setMode("direct");
            setErreur("");
          }}
          type="button"
        >
          URL directe
        </button>
        <button
          className={`px-3 py-1 rounded text-sm border ${mode === "constructeur" ? "!bg-[#000091] !text-white !border-[#000091]" : "!bg-white !text-[#3a3a3a] !border-[#ddd]"}`}
          onClick={() => {
            setMode("constructeur");
            setErreur("");
          }}
          type="button"
        >
          Fichiers numériques
        </button>
      </div>

      <form className="flex flex-col gap-3" onSubmit={valider}>
        {mode === "direct" ? (
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
                Nom du fichier exacte sur le drive
              </label>
              <input
                className="border rounded px-3 py-2 text-sm"
                id="nom-fichier"
                onChange={(event) => setNomFichier(event.target.value)}
                placeholder="mon_image"
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
          className="self-end px-4 py-2 rounded text-sm !bg-[#000091] !text-white"
          type="submit"
        >
          Insérer
        </button>
      </form>
    </Modale>
  );
};
