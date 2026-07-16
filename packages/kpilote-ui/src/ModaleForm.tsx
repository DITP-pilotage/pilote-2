import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

import { Button } from './Button'
import { Modale } from './Modale'

export function ModaleForm<TValues extends FieldValues>({
  open,
  onClose,
  titre,
  description,
  form,
  onSubmit,
  submitLabel,
  submitPendingLabel,
  submitDisabled,
  children,
}: {
  open: boolean
  onClose: () => void
  titre: string
  description?: ReactNode
  form: UseFormReturn<TValues>
  onSubmit: (values: TValues) => void | Promise<void>
  submitLabel: string
  submitPendingLabel?: string
  submitDisabled?: boolean
  children: ReactNode
}): React.JSX.Element {
  const formId = useId()
  const { isSubmitting } = form.formState
  const buttonsDisabled = isSubmitting || submitDisabled === true

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const footer = (
    <>
      <Button variant="secondary" type="button" onClick={onClose} disabled={buttonsDisabled}>
        Annuler
      </Button>
      <Button variant="primary" type="submit" form={formId} disabled={buttonsDisabled}>
        {isSubmitting && submitPendingLabel !== undefined ? submitPendingLabel : submitLabel}
      </Button>
    </>
  )

  return (
    <Modale open={open} onClose={onClose} titre={titre} description={description} footer={footer}>
      <form
        id={formId}
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e)
        }}
      >
        {children}
      </form>
    </Modale>
  )
}
