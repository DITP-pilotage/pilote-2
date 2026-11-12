import { render, screen } from '@testing-library/react'
import { SegmentedField } from './SegmentedField'

const OPTIONS = [
  { value: 'HAUSSE', label: 'À la hausse' },
  { value: 'BAISSE', label: 'À la baisse' },
] as const

it('annonce le libellé et la description avec le groupe de segments', () => {
  render(
    <SegmentedField
      label="Sens souhaité"
      value="HAUSSE"
      onValueChange={() => {}}
      options={OPTIONS}
      description="Une valeur plus élevée est favorable."
    />,
  )
  expect(
    screen.getByRole('radiogroup', {
      name: 'Sens souhaité',
      description: 'Une valeur plus élevée est favorable.',
    }),
  ).toBeInTheDocument()
})
