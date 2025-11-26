import { Collapse } from '@mui/material';
import { Styled } from './MapControls.styles';
import { ControlButton } from './ControlButton';
import { ControlMenu } from './ControlMenu';
import { StyleMenu } from './StyleMenu';
import { DirectionMenu } from './DirectionMenu';
import { MetricMenu } from './MetricMenu';
import { VisualizationMenu } from './VisualizationMenu';
import { useControlMenus } from './useControlMenus';
import {
  getStyleOption,
  getDirectionOption,
  getMetricOption,
  getVisualizationOption,
  CONTROL_BUTTON_ICON_SIZE,
} from './config';

// Material Design standard easing for menu transitions
const MENU_TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const MENU_TRANSITION_DURATION = 225;

/**
 * Map controls with submenu options
 *
 * Features:
 * - Map style menu (dark, light, satellite, streets)
 * - Direction filter (departures, arrivals, diff)
 * - Trip metric selection (total trips, avg duration, avg distance)
 * - Station visualization (points, voronoi)
 * - Rectangular button design with glassmorphic styling
 * - Expandable submenus with square option buttons
 *
 * Mock data for initial phase - will be connected to actual state later
 */
export const MapControls = () => {
  const {
    openMenu,
    selectedStyle,
    selectedDirection,
    selectedMetric,
    selectedVisualization,
    handleMenuToggle,
    handleStyleSelect,
    handleDirectionSelect,
    handleMetricSelect,
    handleVisualizationSelect,
  } = useControlMenus();

  const StyleIcon = getStyleOption(selectedStyle).icon;
  const DirectionIcon = getDirectionOption(selectedDirection).icon;
  const MetricIcon = getMetricOption(selectedMetric).icon;
  const VisualizationIcon = getVisualizationOption(selectedVisualization).icon;

  return (
    <Styled.Container>
      <Styled.InnerContainer>
        <Styled.ButtonGroup>
          <Styled.ButtonWithMenuRow>
            <ControlButton
              icon={<StyleIcon size={CONTROL_BUTTON_ICON_SIZE} />}
              isOpen={openMenu === 'style'}
              onClick={() => handleMenuToggle('style')}
              ariaLabel="Map style"
            />
            <Styled.CollapsedMenuWrapper isFirst>
              <Collapse
                in={openMenu === 'style'}
                timeout={MENU_TRANSITION_DURATION}
                easing={MENU_TRANSITION_EASING}
                orientation="horizontal"
              >
                <ControlMenu label="Map style">
                  <StyleMenu selectedStyle={selectedStyle} onSelect={handleStyleSelect} />
                </ControlMenu>
              </Collapse>
            </Styled.CollapsedMenuWrapper>
          </Styled.ButtonWithMenuRow>

          <Styled.ButtonWithMenuRow>
            <ControlButton
              icon={<VisualizationIcon size={CONTROL_BUTTON_ICON_SIZE} />}
              isOpen={openMenu === 'visualization'}
              onClick={() => handleMenuToggle('visualization')}
              ariaLabel="Station visualization"
            />
            <Styled.CollapsedMenuWrapper>
              <Collapse
                in={openMenu === 'visualization'}
                timeout={MENU_TRANSITION_DURATION}
                easing={MENU_TRANSITION_EASING}
                orientation="horizontal"
              >
                <ControlMenu label="Station visualization">
                  <VisualizationMenu
                    selectedVisualization={selectedVisualization}
                    onSelect={handleVisualizationSelect}
                  />
                </ControlMenu>
              </Collapse>
            </Styled.CollapsedMenuWrapper>
          </Styled.ButtonWithMenuRow>

          <Styled.Divider />

          <Styled.ButtonWithMenuRow>
            <ControlButton
              icon={<MetricIcon size={CONTROL_BUTTON_ICON_SIZE} />}
              isOpen={openMenu === 'parameter'}
              onClick={() => handleMenuToggle('parameter')}
              ariaLabel="Trip metric"
            />
            <Styled.CollapsedMenuWrapper>
              <Collapse
                in={openMenu === 'parameter'}
                timeout={MENU_TRANSITION_DURATION}
                easing={MENU_TRANSITION_EASING}
                orientation="horizontal"
              >
                <ControlMenu label="Trip metric">
                  <MetricMenu selectedMetric={selectedMetric} onSelect={handleMetricSelect} />
                </ControlMenu>
              </Collapse>
            </Styled.CollapsedMenuWrapper>
          </Styled.ButtonWithMenuRow>

          <Styled.ButtonWithMenuRow>
            <ControlButton
              icon={<DirectionIcon size={CONTROL_BUTTON_ICON_SIZE} />}
              isOpen={openMenu === 'direction'}
              onClick={() => handleMenuToggle('direction')}
              ariaLabel="Direction filter"
            />
            <Styled.CollapsedMenuWrapper>
              <Collapse
                in={openMenu === 'direction'}
                timeout={MENU_TRANSITION_DURATION}
                easing={MENU_TRANSITION_EASING}
                orientation="horizontal"
              >
                <ControlMenu label="Trip direction">
                  <DirectionMenu
                    selectedDirection={selectedDirection}
                    onSelect={handleDirectionSelect}
                  />
                </ControlMenu>
              </Collapse>
            </Styled.CollapsedMenuWrapper>
          </Styled.ButtonWithMenuRow>
        </Styled.ButtonGroup>
      </Styled.InnerContainer>
    </Styled.Container>
  );
};
