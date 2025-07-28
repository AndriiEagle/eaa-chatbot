import React, { CSSProperties } from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  helpText?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  enabled,
  setEnabled,
  helpText,
}) => {
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '0.75rem',
      userSelect: 'none',
    } as CSSProperties,
    label: {
      fontSize: '0.875rem',
      fontWeight: 600,
    } as CSSProperties,
    switch: {
      position: 'relative',
      display: 'inline-block',
      width: '38px',
      height: '22px',
    } as CSSProperties,
    switchInput: {
      opacity: 0,
      width: 0,
      height: 0,
    } as CSSProperties,
    slider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: enabled ? '#3b82f6' : '#4b5563',
      transition: '.3s',
      borderRadius: '34px',
    } as CSSProperties,
    sliderBefore: {
      position: 'absolute',
      content: '""',
      height: '16px',
      width: '16px',
      left: '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '.3s',
      borderRadius: '50%',
      transform: enabled ? 'translateX(16px)' : 'translateX(0)',
    } as CSSProperties,
    helpText: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginTop: '0.25rem',
    } as CSSProperties,
  };

  const toggle = () => setEnabled(!enabled);

  return (
    <div>
      <div style={styles.container} onClick={toggle}>
        <span style={styles.label}>{label}</span>
        <div style={styles.switch}>
          <div style={styles.slider}>
            <div style={styles.sliderBefore}></div>
          </div>
        </div>
      </div>
      {helpText && <div style={styles.helpText}>{helpText}</div>}
    </div>
  );
};

export default ToggleSwitch;
