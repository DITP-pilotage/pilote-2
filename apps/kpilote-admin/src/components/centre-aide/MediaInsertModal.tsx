import { zodResolver } from '@hookform/resolvers/zod'
import { MEDIA_EXTENSIONS, MEDIA_ORIGINS, type MediaKind } from '@pilote/kpilote-shared/mediaUrl'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { ModaleForm } from '@pilote/kpilote-ui/ModaleForm'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
  buildMediaFormDefaults,
  buildMediaFormSchema,
  needsFileDetails,
  resolveMediaUrl,
  type MediaFormValues,
} from './mediaForm'

const TITLES: Record<MediaKind, string> = {
  image: 'Insérer une image',
  video: 'Insérer une vidéo',
}

export function MediaInsertModal({
  kind,
  open,
  onClose,
  onInsert,
}: {
  kind: MediaKind
  open: boolean
  onClose: () => void
  onInsert: (url: string) => void
}) {
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(buildMediaFormSchema(kind)),
    defaultValues: buildMediaFormDefaults(kind),
  })
  const { errors } = form.formState
  const url = useWatch({ control: form.control, name: 'url' })

  const insert = (values: MediaFormValues) => {
    onInsert(resolveMediaUrl(values))
    onClose()
  }

  return (
    <ModaleForm
      open={open}
      onClose={onClose}
      titre={TITLES[kind]}
      description={`Hébergement accepté : ${MEDIA_ORIGINS[kind].join(', ')}.`}
      form={form}
      onSubmit={insert}
      submitLabel="Insérer"
    >
      <div className="space-y-4">
        <FieldInput
          label="URL"
          type="url"
          placeholder={`${MEDIA_ORIGINS[kind][0] ?? ''}/…`}
          error={errors.url?.message}
          {...form.register('url')}
        />
        {needsFileDetails(url.trim()) ? (
          <>
            <FieldInput
              label="Nom du fichier"
              hint="Nom exact sur fichiers.numerique.gouv.fr, sans l’extension."
              error={errors.fileName?.message}
              {...form.register('fileName')}
            />
            <Controller
              control={form.control}
              name="extension"
              render={({ field }) => (
                <FieldSelect
                  label="Extension"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  options={MEDIA_EXTENSIONS[kind].map((extension) => ({
                    value: extension,
                    label: `.${extension}`,
                  }))}
                />
              )}
            />
          </>
        ) : null}
      </div>
    </ModaleForm>
  )
}
