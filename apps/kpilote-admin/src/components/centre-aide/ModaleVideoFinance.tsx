import { estUrlHttpSure } from '@pilote/kpilote-shared/url'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { Modale } from '@pilote/kpilote-ui/Modale'
import { useState } from 'react'

const HOST_AUTORISE = 'video.finances.gouv.fr'

export function ModaleVideoFinance({
  open,
  onClose,
  onValider,
}: {
  open: boolean
  onClose: () => void
  onValider: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const [erreur, setErreur] = useState<string | undefined>(undefined)

  const fermer = () => {
    setUrl('')
    setErreur(undefined)
    onClose()
  }

  const valider = () => {
    const propre = url.trim()
    if (!estUrlHttpSure(propre)) {
      setErreur('L’URL doit être un lien http(s) valide.')
      return
    }
    if (new URL(propre).hostname !== HOST_AUTORISE) {
      setErreur(`L’URL doit provenir de ${HOST_AUTORISE}.`)
      return
    }
    onValider(propre)
    fermer()
  }

  return (
    <Modale
      open={open}
      onClose={fermer}
      titre="Insérer une vidéo"
      description={`Collez le lien d’intégration de la vidéo (${HOST_AUTORISE}).`}
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          <Button onClick={valider}>Insérer</Button>
        </>
      }
    >
      <FieldInput
        label="URL de la vidéo"
        type="url"
        value={url}
        error={erreur}
        placeholder="https://video.finances.gouv.fr/…"
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') valider()
        }}
      />
    </Modale>
  )
}
