import styled from "@emotion/styled";

export const LineChartLegendeStyled = styled.div`

  .tag-selectionnee {
    color: white;
    background-color: var(--blue-france-sun-113-625);
  }
    
  .legend-checkbox-container {
    display: flex;
    align-items: flex-start;
  }

  .legend-content {
    display: flex;
    flex-direction: column;
    white-space: nowrap;
  }
    
  .legend-item {
    display: flex;
    align-items: center;
  }

  .line-dashed {
    width: 50px;
    height: 0;
    border-top: 3px dashed #999999;
  }

  .line-indicator {
    width: 50px;
    height: 3px;
    background: #999999;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background-color: gray;
      border-radius: 50%;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  }
`;

export const CheckboxGroupeStyled = styled.div<{
  color: string;
}>`
  .fr-checkbox-group input[type="checkbox"]:checked + label::before {
    background-color: ${({ color }) => color};
  }

  .fr-checkbox-group input[type="checkbox"] + label::before {
    background-image:
      radial-gradient(
        at 5px 4px,
        transparent 4px,
        ${({ color }) => color} 4px,
        ${({ color }) => color} 5px,
        transparent 6px
      ),
      linear-gradient(${({ color }) => color}, ${({ color }) => color}),
      radial-gradient(
        at calc(100% - 5px) 4px,
        transparent 4px,
        ${({ color }) => color} 4px,
        ${({ color }) => color} 5px,
        transparent 6px
      ),
      linear-gradient(${({ color }) => color}, ${({ color }) => color}),
      radial-gradient(
        at calc(100% - 5px) calc(100% - 4px),
        transparent 4px,
        ${({ color }) => color} 4px,
        ${({ color }) => color} 5px,
        transparent 6px
      ),
      linear-gradient(${({ color }) => color}, ${({ color }) => color}),
      radial-gradient(
        at 5px calc(100% - 4px),
        transparent 4px,
        ${({ color }) => color} 4px,
        ${({ color }) => color} 5px,
        transparent 6px
      ),
      linear-gradient(${({ color }) => color}, ${({ color }) => color}),
      var(--data-uri-svg);
  }
`;
