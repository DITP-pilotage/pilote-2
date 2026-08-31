import { exec, execFile } from "child_process";

/**
 * Playwright n'arrive pas à arrêter le serveur qu'il démarre : la commande
 * `portless … dotenv … next dev` empile trois processus, et tuer le premier laisse
 * `next dev` orphelin (PPID 1). Deux conséquences, jusqu'ici subies en local :
 * le run courant sort en code 1 après 1400 s d'attente de teardown même quand tous
 * les tests passent, et le run suivant échoue sur un timeout de webServer parce que
 * le tunnel portless a disparu alors que le serveur, lui, occupe encore la place.
 *
 * On cible donc les processus par leur ligne de commande. Le motif est restreint au
 * dossier de CETTE app : un `pkill -f "next dev"` nu tuerait les serveurs des autres
 * projets ouverts sur la machine.
 */
const MOTIFS_SERVEUR = ["next/dist/bin/next", "dotenv-cli/cli.js"];

/**
 * Chemin absolu volontaire : resoudre `pkill` via PATH laisserait un repertoire
 * inscriptible du PATH decider quel binaire s'execute (sonarjs/no-os-command-from-path).
 * `/usr/bin/pkill` est l'emplacement standard sous macOS comme sous Linux.
 *
 * `pkill` sort en 1 quand rien ne correspond : c'est un cas nominal ici.
 */
const PKILL = "/usr/bin/pkill";

function tuerParMotif(motif: string): Promise<void> {
  return new Promise((resolve) => {
    execFile(PKILL, ["-9", "-f", motif], () => resolve());
  });
}

export default async function globalTeardown() {
  const baseUrl = new URL(process.env.BASE_URL!);
  const racine = process.cwd();

  const motifs = MOTIFS_SERVEUR.map((motif) => `${racine}.*${motif}`);

  // Le tunnel portless est lancé avec un chemin relatif : il ne porte pas `racine`
  // dans sa ligne de commande. Le nom d'app suffit à le désigner sans ambiguïté.
  const appPortless = baseUrl.hostname.replace(/\.localhost$/, "");
  motifs.push(`portless.*${appPortless}`);

  await Promise.all(motifs.map(tuerParMotif));

  if (!process.env.CI) return;

  // Filet supplémentaire en CI : retrouver le PID par le port si la ligne de
  // commande ne correspondait pas. `ss` n'existe que sous Linux, et le pipeline
  // impose un shell — les valeurs interpolées viennent de la config, pas d'une entrée.
  await new Promise<void>((resolve) => {
    exec(
      `pkill -9 -f "next-server" 2>/dev/null; ss -tlnp 'sport = :${baseUrl.port}' | grep -oP 'pid=\\K[0-9]+' | sort -u | xargs -r kill -9 2>/dev/null; true`,
      { shell: "/bin/bash" },
      () => resolve(),
    );
  });
}
