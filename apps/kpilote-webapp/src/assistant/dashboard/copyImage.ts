import { toBlob } from 'html-to-image'

const renderPng = async (element: HTMLElement): Promise<Blob> => {
  const blob = await toBlob(element, { pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!blob) throw new Error("L'image du tableau de bord n'a pas pu être produite")
  return blob
}

/**
 * Copie le dashboard en PNG. Safari n'accepte l'écriture que pendant le geste de
 * l'utilisateur : l'élément du presse-papiers reçoit la promesse de l'image, construite
 * pendant le clic, plutôt que l'image une fois prête.
 */
export const copyDashboardImage = (element: HTMLElement): Promise<void> =>
  navigator.clipboard.write([new ClipboardItem({ 'image/png': renderPng(element) })])
