import { memo, useMemo, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/router";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChantierLinks } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { remarkChantierLinks } from "@/components/_commons/ChatUI/remarkChantierLinks";
import {
  isInternalHref,
  linkEvent,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";
import type { AssistantEvent } from "@/components/_commons/ChatUI/useAssistantTracking";
import { clsxm } from "@/utils/clsxm";

// Liste des noms d'outils Albert. À maintenir quand un nouvel outil est ajouté
// à la ToolSet dans src/app/api/albert/chat/route.ts.
const TOOL_NAMES = [
  "clarify_with_choices",
  // Ancien nom, encore présent dans les conversations antérieures au renommage.
  "display_choices",
  "create_dashboard",
  "compose_dashboard",
  "export_rapport",
  "rediger_synthese_territoire",
  "rediger_comparaison_territoires",
  "get_taux_avancement_territoire",
  "get_chantiers",
  "get_indicateurs",
  "get_evolution_indicateur",
  "get_historique_indicateur",
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
 * (ex: "clarify_with_choices({...})" écrit en texte au lieu d'être invoqué via le
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

const useLinkTracking = (event: AssistantEvent) => {
  const track = useChatTracking();
  const trackLink = () => track(event);
  const trackMiddleClick = (mouseEvent: MouseEvent) => {
    if (mouseEvent.button === 1) trackLink();
  };
  return { trackLink, trackMiddleClick };
};

/**
 * Un lien vers une page de PILOTE depuis le chat : il navigue sans recharger
 * et réduit la conversation dans le dock.
 */
export const LienInterneAssistant = ({
  href,
  className,
  libelle,
  event,
  children,
}: {
  href: string;
  className?: string;
  /** Nom accessible, quand le contenu du lien ne se lit pas bien d'un trait. */
  libelle?: string;
  /** Événement suivi au clic, à la place de celui des liens de la réponse. */
  event?: AssistantEvent;
  children?: ReactNode;
}) => {
  const router = useRouter();
  const { minimize } = useAlbertConversation();
  const { trackLink, trackMiddleClick } = useLinkTracking(
    event ?? linkEvent(href),
  );

  return (
    <a
      aria-label={libelle}
      className={className}
      href={href}
      onAuxClick={trackMiddleClick}
      onClick={(event) => {
        trackLink();
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

const MarkdownLink = ({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) => {
  const { trackLink, trackMiddleClick } = useLinkTracking(linkEvent(href));

  if (!isInternalHref(href)) {
    return (
      <a
        href={href}
        onAuxClick={trackMiddleClick}
        onClick={trackLink}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return <LienInterneAssistant href={href}>{children}</LienInterneAssistant>;
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
