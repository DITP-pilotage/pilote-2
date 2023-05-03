import styled from '@emotion/styled';

const ExplicationEtapeIndicateurStyled = styled.div`
    height: 100%;
    background-color: #FFF;
    border: 1px solid var(--border-default-grey);
    
    .explication-indicateur__numero {
        --diametre: 2rem;

        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--diametre);
        height: var(--diametre);
        color: #FFF;
        background-color: var(--background-action-high-blue-france);
        border-radius: var(--diametre);

        &::before,
        &::after {
            position: absolute;
            display: block;
            height: .5rem;
            content: '';
            background-color: var(--background-action-high-blue-france);
            border-radius: var(--diametre);
        }

        &::before {
            left: calc(var(--diametre) - .5rem);
            width: var(--diametre);
        }

        &::after {
            left: calc(var(--diametre) * 2);
            width: .5rem;
        }
    }
`;

export default ExplicationEtapeIndicateurStyled;
