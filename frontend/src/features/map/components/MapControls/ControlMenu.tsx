import { ReactNode } from 'react';
import { Styled } from './MapControls.styles';

interface ControlMenuProps {
  label: string;
  children: ReactNode;
}

export const ControlMenu = ({ label, children }: ControlMenuProps) => {
  return (
    <Styled.MenuContainer>
      <Styled.SubGroup>
        <Styled.SubGroupLabel>{label}</Styled.SubGroupLabel>
        {children}
      </Styled.SubGroup>
    </Styled.MenuContainer>
  );
};
