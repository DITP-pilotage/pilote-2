import PageImprimableConteneurProps from '@/components/_commons/PageImprimableConteneur/PageImprimableConteneur.interface';
import PageImprimableConteneurStyled from '@/components/_commons/PageImprimableConteneur/PageImprimableConteneur.styled';

export default function PageImprimableConteneur({ children, entête, piedDePage, pageDeGarde }: PageImprimableConteneurProps) {
  return (
    <>
      { pageDeGarde }
      <PageImprimableConteneurStyled>
        <thead>
          <tr>
            <th>
              { entête }
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              { children }
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              { piedDePage }
            </td>
          </tr>
        </tfoot>
      </PageImprimableConteneurStyled>
    </>
  );
}
