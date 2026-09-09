import { memo, useMemo, type ReactNode } from "react";
import { useRouter } from "next/router";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChantierLinks } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { remarkChantierLinks } from "@/components/_commons/ChatUI/remarkChantierLinks";
import { clsxm } from "@/utils/clsxm";

// Liste des noms d'outils Albert. À maintenir quand un nouvel outil est ajouté
// à la ToolSet dans src/app/api/albert/chat/route.ts.
const TOOL_NAMES = [
  "display_choices",
  "create_dashboard",
  "compose_dashboard",
  "export_rapport",
  "get_taux_avancement_territoire",
  "get_chantiers",
  "get_indicateurs",
];

const TOOL_CALL_START_REGEX = new RegExp(
  `^\\s*(?:${TOOL_NAMES.join("|")})\\s*\\(`,
);

function countParens(line: string): number {
  let delta = 0;
  for (const char of line) {
    if (char === "(") delta += 1;
    else if (char === ")") delta -= 1;
  }
  return delta;
}

/**
 * Supprime du texte tout bloc ressemblant à un appel d'outil en pseudo-code
 * (ex: "display_choices({...})" écrit en texte au lieu d'être invoqué via le
 * mécanisme de function calling). Parfois, les petits modèles reproduisent la
 * syntaxe de tool call telle qu'ils l'ont vue en training, et le bloc apparaît
 * comme du texte brut à l'utilisateur. Ce helper est un filet de sécurité.
 */
export function stripPseudoToolCalls(text: string): string {
  const lines = text.split("\n");
  const kept: string[] = [];
  let parenDepth = 0;
  let stripping = false;

  for (const line of lines) {
    if (!stripping) {
      if (TOOL_CALL_START_REGEX.test(line)) {
        parenDepth = countParens(line);
        if (parenDepth > 0) {
          stripping = true;
        }
        // Si parenDepth <= 0 la ligne s'ouvre et se ferme sur elle-même :
        // on la strip sans entrer en mode multi-lignes.
        continue;
      }
      kept.push(line);
    } else {
      parenDepth += countParens(line);
      if (parenDepth <= 0) {
        stripping = false;
        parenDepth = 0;
      }
    }
  }

  // Nettoyage : séparateurs markdown orphelins en fin de texte, et trim.
  return kept
    .join("\n")
    .replace(/(\n\s*---\s*)+\s*$/u, "")
    .trimEnd();
}

/**
 * Supprime les paragraphes markdown ne contenant que des espaces insécables
 * (`&nbsp;` ou  ). Le LLM en produit parfois pour aérer son rendu, mais
 * ReactMarkdown les rend en `<p>&nbsp;</p>` qui ajoutent du vide visuel.
 */
export function stripParagraphesVides(text: string): string {
  return text
    .split("\n")
    .filter((ligne) => {
      // Sans regex : `(&nbsp;| )+` etait un quantificateur imbrique, donc
      // super-lineaire. On retire les insecables et on ne filtre la ligne que si
      // elle en portait au moins un ET que le reste n'est que du blanc — une ligne
      // de pur blanc reste un separateur de paragraphe et doit etre conservee.
      const sansInsecables = ligne.replaceAll("&nbsp;", "").replaceAll(" ", "");
      return !(sansInsecables !== ligne && sansInsecables.trim() === "");
    })
    .join("\n");
}

const MarkdownLink = ({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) => {
  const router = useRouter();
  const { minimize } = useAlbertConversation();

  if (!href?.startsWith("/")) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={(event) => {
        // Let middle-click, Ctrl/Cmd-click and "open in new tab" through.
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        minimize();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
};

const components = { a: MarkdownLink };

export const AssistantMessageText = memo(function AssistantMessageText({
  text,
  streaming = false,
}: {
  text: string;
  /** Affiche un curseur clignotant à la fin du texte en cours d'écriture. */
  streaming?: boolean;
}) {
  const chantierLinkOptions = useChantierLinks();
  const sanitized = stripParagraphesVides(stripPseudoToolCalls(text));
  const remarkPlugins = useMemo<Options["remarkPlugins"]>(
    () => [remarkGfm, [remarkChantierLinks, chantierLinkOptions]],
    [chantierLinkOptions],
  );

  return (
    <div
      className={clsxm("albert-markdown", {
        "albert-markdown--streaming": streaming,
      })}
    >
      <ReactMarkdown components={components} remarkPlugins={remarkPlugins}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
});
