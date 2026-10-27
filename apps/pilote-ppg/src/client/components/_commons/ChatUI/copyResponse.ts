import { toBlob } from "html-to-image";

const DASHBOARD_ATTRIBUTE = "data-copyable-dashboard";

/**
 * Le texte et le dashboard se copient avec deux actions distinctes : un seul
 * presse-papiers multi-format (HTML, texte, image) se colle différemment selon
 * l'application qui le reçoit (image seule dans Jira, texte seul dans Docs…).
 * Un format par copie garantit le même résultat partout.
 */
export const markCopyableDashboard = () => ({ [DASHBOARD_ATTRIBUTE]: "" });

const captureDashboard = async (element: HTMLElement): Promise<Blob> => {
  const capture = await toBlob(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  if (capture === null) {
    throw new Error("La capture du dashboard a échoué");
  }
  return capture;
};

export const copyText = ({ text }: { text: string }): Promise<void> =>
  navigator.clipboard.writeText(text);

/**
 * Le presse-papiers ne porte qu'une image : seul le premier dashboard de la
 * réponse est copié.
 *
 * L'image est passée en promesse : Safari n'autorise l'écriture que si
 * `ClipboardItem` est construit pendant le clic, avant la capture asynchrone.
 */
export const copyDashboardImage = async ({
  root,
}: {
  root: HTMLElement;
}): Promise<void> => {
  const dashboard = root.querySelector<HTMLElement>(`[${DASHBOARD_ATTRIBUTE}]`);
  if (dashboard === null) {
    throw new Error("La réponse ne contient pas de dashboard");
  }

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": captureDashboard(dashboard) }),
  ]);
};
