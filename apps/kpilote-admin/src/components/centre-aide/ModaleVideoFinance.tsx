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
    let hostname: string
    try {
      hostname = new URL(url.trim()).hostname
    } catch {
      setErreur('L’URL saisie n’est pas valide.')
      return
    }
    if (hostname !== HOST_AUTORISE) {
      setErreur(`L’URL doit provenir de ${HOST_AUTORISE}.`)
      return
    }
    onValider(url.trim())
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
