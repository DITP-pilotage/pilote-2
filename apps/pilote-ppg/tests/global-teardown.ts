import { exec, execFile } from "child_process";
import { readFileSync, rmSync } from "fs";
import { join } from "path";

/**
 * Playwright n'arrive pas à arrêter le serveur qu'il démarre : la commande
 * `portless … dotenv … next dev` empile trois processus, et tuer le premier laisse
 * `next dev` orphelin (PPID 1). Le run suivant échoue alors sur un timeout de
 * webServer, sans rapport avec les tests : le tunnel portless a disparu alors que le
 * serveur, lui, occupe encore la place.
 *
 * Le serveur ne peut PAS être retrouvé par sa ligne de commande : une fois démarré,
 * Next renomme son processus en `next-server (v16.3.3)`, qui ne contient plus aucun
 * chemin. Un `pkill -f "next-server"` le trouverait, mais tuerait aussi les serveurs
 * Next des autres projets ouverts sur la machine.
 *
 * On lit donc son PID dans `.next/dev/lock`, que Next écrit lui-même. C'est
 * intrinsèquement limité à CETTE app, puisque le fichier est dans son propre `.next/`.
 */
const FICHIER_VERROU = ".next/dev/lock";

/** Les wrappers, eux, gardent leur chemin : on peut les cibler par motif. */
const MOTIFS_WRAPPERS = ["dotenv-cli/cli.js"];

/**
 * Chemin absolu volontaire : résoudre `pkill` via PATH laisserait un répertoire
 * inscriptible décider quel binaire s'exécute (sonarjs/no-os-command-from-path).
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

/**
 * Le serveur de DEV d'un développeur écrit dans le même verrou. On ne touche donc
 * qu'un serveur démarré APRÈS ce runner : `startedAt` antérieur = serveur qui ne nous
 * appartient pas, on le laisse tranquille plutôt que de couper le travail en cours.
 */
function tuerServeurNext(racine: string): void {
  const chemin = join(racine, FICHIER_VERROU);
  const demarrageRunner = Date.now() - process.uptime() * 1000;

  let verrou: { pid?: number; startedAt?: number };
  try {
    verrou = JSON.parse(readFileSync(chemin, "utf8")) as typeof verrou;
  } catch {
    return; // Verrou absent ou illisible : rien à faire.
  }

  if (!verrou.pid) return;
  if (verrou.startedAt !== undefined && verrou.startedAt < demarrageRunner)
    return;

  try {
    process.kill(verrou.pid, "SIGKILL");
  } catch {
    // Processus déjà mort.
  }
  // Sans ça, le prochain `next dev` croit qu'un serveur tourne déjà et refuse de
  // démarrer sur le port attendu.
  rmSync(chemin, { force: true });
}

export default async function globalTeardown() {
  const baseUrl = new URL(process.env.BASE_URL!);
  const racine = process.cwd();

  tuerServeurNext(racine);

  const motifs = MOTIFS_WRAPPERS.map((motif) => `${racine}.*${motif}`);
  // Le tunnel portless est lancé avec un chemin relatif : il ne porte pas `racine`
  // dans sa ligne de commande. Le nom d'app suffit à le désigner sans ambiguïté.
  motifs.push(`portless.*${baseUrl.hostname.replace(/\.localhost$/, "")}`);

  await Promise.all(motifs.map(tuerParMotif));

  if (!process.env.CI) return;

  // Filet conservé tel quel en CI, où le risque de tuer le serveur d'un autre projet
  // n'existe pas. `ss` est spécifique à Linux, et le pipeline impose un shell.
  await new Promise<void>((resolve) => {
    exec(
      `pkill -9 -f "next-server" 2>/dev/null; ss -tlnp 'sport = :${baseUrl.port}' | grep -oP 'pid=\\K[0-9]+' | sort -u | xargs -r kill -9 2>/dev/null; true`,
      { shell: "/bin/bash" },
      () => resolve(),
    );
  });
}
