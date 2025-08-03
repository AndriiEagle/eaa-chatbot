import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ToggleSwitch = ({ label, enabled, setEnabled, helpText }) => {
    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
            userSelect: 'none',
        },
        label: {
            fontSize: '0.875rem',
            fontWeight: 600,
        },
        switch: {
            position: 'relative',
            display: 'inline-block',
            width: '38px',
            height: '22px',
        },
        switchInput: {
            opacity: 0,
            width: 0,
            height: 0,
        },
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
        },
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
        },
        helpText: {
            fontSize: '0.75rem',
            color: '#9ca3af',
            marginTop: '0.25rem',
        },
    };
    const toggle = () => setEnabled(!enabled);
    return (_jsxs("div", { children: [_jsxs("div", { style: styles.container, onClick: toggle, children: [_jsx("span", { style: styles.label, children: label }), _jsx("div", { style: styles.switch, children: _jsx("div", { style: styles.slider, children: _jsx("div", { style: styles.sliderBefore }) }) })] }), helpText && _jsx("div", { style: styles.helpText, children: helpText })] }));
};
export default ToggleSwitch;
