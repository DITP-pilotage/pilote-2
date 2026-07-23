import { render, screen } from '@testing-library/react'

it('rend un noeud React sous jsdom', () => {
  render(<p>centre daide</p>)
  expect(screen.getByText('centre daide')).toBeInTheDocument()
})
