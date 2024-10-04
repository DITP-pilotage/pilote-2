import { flexRender, Table } from '@tanstack/react-table';
import { FunctionComponent } from 'react';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import RapportDétailléTableauChantiersEnTêteStyled from './RapportDétailléTableauChantiersEnTête.styled';

interface TableauChantiersEnTêteProps {
  tableau: Table<DonnéesTableauChantiers>
}

const RapportDétailléTableauChantiersEnTête: FunctionComponent<TableauChantiersEnTêteProps> = ({ tableau }) => {
  return (
    <RapportDétailléTableauChantiersEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                className='fr-px-1w'
                key={header.id}
                style={{
                  width: header.column.columnDef.meta?.width ?? undefined,
                }}
              >
                <p className='fr-mb-0 fr-text--sm'>
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                </p>
              </th>
            ))}
          </tr>
        ))
      }
    </RapportDétailléTableauChantiersEnTêteStyled>
  );
};

export default RapportDétailléTableauChantiersEnTête;
