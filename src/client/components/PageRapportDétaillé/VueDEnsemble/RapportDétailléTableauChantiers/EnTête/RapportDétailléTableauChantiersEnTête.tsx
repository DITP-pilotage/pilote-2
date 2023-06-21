import { flexRender } from '@tanstack/react-table';
import TableauChantiersEnTêteProps from './RapportDétailléTableauChantiersEnTête.interface';
import RapportDétailléTableauChantiersEnTêteStyled from './RapportDétailléTableauChantiersEnTête.styled';

export default function RapportDétailléTableauChantiersEnTête({ tableau }: TableauChantiersEnTêteProps) {
  return (
    <RapportDétailléTableauChantiersEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                style={{
                  width: header.column.columnDef.meta?.width ?? undefined,
                }}
              >
                <p className="fr-mb-0 fr-text--sm">
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                </p>
              </th>
            ))}
          </tr>
        ))
      }
    </RapportDétailléTableauChantiersEnTêteStyled>
  );
}
