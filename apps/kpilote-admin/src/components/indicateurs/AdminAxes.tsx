import { type AxeApiModel, type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'

import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Picker } from '@pilote/kpilote-ui/Picker'
import { PickerOptionNomId } from '@pilote/kpilote-ui/PickerOptionNomId'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { axesAllQueryOptions } from '@/queries/axes'

const FONCTION_LABEL: Record<FonctionAgregationAxe, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
}

const FONCTION_OPTIONS = Object.entries(FONCTION_LABEL).map(([value, label]) => ({ value, label }))

export function AdminAxes() {
  const form = useIndicateurFormContext()
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'axes' })
  const axesDeclares = useWatch({ control: form.control, name: 'axes' })
  const { data: axes } = useSuspenseQuery(axesAllQueryOptions())

  const axeParId = new Map(axes.map((axe) => [axe.id, axe]))
  const idsDeclares = (axesDeclares ?? []).map((axe) => axe.id)
  const disponibles = axes.filter((axe) => !idsDeclares.includes(axe.id))

  return (
    <div className="border-t border-border pt-5">
      <span className="mb-1 block text-sm font-bold">Axes</span>
      <Subtitle className="mb-4">
        Découpent les valeurs de l’indicateur en plus du territoire (ex. par opérateur). La fonction
        calcule chaque niveau de l’axe puis « Tous ». Une fois que l’indicateur a des valeurs, on ne
        peut plus ajouter ni retirer d’axe ; la fonction et l’ordre restent modifiables.
      </Subtitle>

      <Picker<AxeApiModel>
        items={disponibles}
        onSelect={(axe) => append({ id: axe.id, fonction: 'SUM' })}
        getKey={(axe) => axe.id}
        getSearchText={(axe) => `${axe.id} ${axe.nom}`}
        renderItem={(axe) => <PickerOptionNomId nom={axe.nom} id={axe.id} />}
        triggerLabel="Ajouter un axe"
        disabled={false}
      />

      {fields.length > 1 ? (
        <p className="mt-3 mb-0 rounded-md bg-surface-tinted px-3 py-2 text-xs text-text-muted">
          <b>Ordre des axes.</b> Pour calculer « Tous », les axes se combinent dans cet ordre, du
          premier au dernier. Avec uniquement des sommes, l’ordre ne change rien. Avec une moyenne,
          il change le résultat dès qu’il manque des combinaisons (par exemple un opérateur sans
          donnée pour un type de fraude) : placez en premier l’axe qu’il faut combiner d’abord.
        </p>
      ) : null}

      <ol className="mt-3 space-y-2 pl-0">
        {fields.map((field, index) => {
          const axe = axeParId.get(idsDeclares[index] ?? '')
          return (
            <li
              key={field.id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2"
            >
              {fields.length > 1 ? (
                <span className="w-5 text-xs font-semibold text-text-muted">{index + 1}.</span>
              ) : null}
              <span className="flex-[2] text-sm text-text">
                {axe?.nom ?? idsDeclares[index]}
                {axe ? (
                  <span className="ml-2 text-xs text-text-muted">
                    {axe.niveaux.map((niveau) => niveau.nom).join(' → ')}
                  </span>
                ) : null}
              </span>
              <div className="flex-1">
                <Controller
                  control={form.control}
                  name={`axes.${index}.fonction`}
                  render={({ field: champ }) => (
                    <FieldSelect
                      label={`Fonction de l’axe ${axe?.nom ?? ''}`}
                      hideLabel
                      value={champ.value}
                      onValueChange={champ.onChange}
                      onBlur={champ.onBlur}
                      options={FONCTION_OPTIONS}
                    />
                  )}
                />
              </div>
              {fields.length > 1 ? (
                <>
                  <IconButton
                    label={`Monter ${axe?.nom ?? ''}`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    label={`Descendre ${axe?.nom ?? ''}`}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                </>
              ) : null}
              <IconButton
                variant="danger"
                label={`Retirer ${axe?.nom ?? ''}`}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </IconButton>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
