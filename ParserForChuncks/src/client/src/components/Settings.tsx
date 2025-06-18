import React, { CSSProperties } from 'react';
import ToggleSwitch from './ToggleSwitch';

interface SettingsProps {
  datasetId: string;
  setDatasetId: (id: string) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (value: number) => void;
  maxChunks: number;
  setMaxChunks: (value: number) => void;
  clearHistory: () => void;
  isProactiveAgentEnabled: boolean;
  setIsProactiveAgentEnabled: (enabled: boolean) => void;
}

/**
 * Компонент настроек приложения
 */
const Settings: React.FC<SettingsProps> = ({
  datasetId,
  setDatasetId,
  similarityThreshold,
  setSimilarityThreshold,
  maxChunks,
  setMaxChunks,
  clearHistory,
  isProactiveAgentEnabled,
  setIsProactiveAgentEnabled
}) => {
  const styles = {
    container: {
      position: 'fixed',
      right: '2rem',
      top: '2rem',
      zIndex: 10,
      background: '#202225',
      border: '1px solid #333',
      borderRadius: '0.75rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '18rem',
    } as CSSProperties,
    title: {
      fontWeight: 600,
      fontSize: '0.875rem',
      marginBottom: '0.25rem',
      userSelect: 'none',
    } as CSSProperties,
    label: {
      fontSize: '0.75rem',
      fontWeight: 600,
    } as CSSProperties,
    mono: {
      fontFamily: 'monospace',
    } as CSSProperties,
    slider: {
      width: '100%',
      accentColor: '#3b82f6',
    } as CSSProperties,
    helpText: {
      fontSize: '0.75rem',
      color: '#9ca3af',
    } as CSSProperties,
    input: {
      background: '#23272A',
      color: 'white',
      border: '1px solid #333',
      borderRadius: '0.375rem',
      padding: '0.25rem 0.5rem',
    } as CSSProperties,
    inputSmall: {
      width: '5rem',
    } as CSSProperties,
    inputFull: {
      width: '100%',
    } as CSSProperties,
    clearButton: {
      marginTop: '0.5rem',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
    } as CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        Настройки поиска
      </div>
      
      <label style={styles.label}>
        Порог сходства (UI): <span style={styles.mono}>{similarityThreshold}</span>
      </label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={similarityThreshold}
        onChange={e => setSimilarityThreshold(parseFloat(e.target.value))}
        style={styles.slider}
      />
      <span style={styles.helpText}>
        Чем выше — тем точнее, но меньше результатов. Чем ниже — больше, но шумнее.
      </span>
      
      <label style={{ ...styles.label, marginTop: '0.5rem' }}>
        Максимум чанков: <span style={styles.mono}>{maxChunks}</span>
      </label>
      <input
        type="number"
        min="1"
        max="20"
        value={maxChunks}
        onChange={e => setMaxChunks(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
        style={{ ...styles.input, ...styles.inputSmall }}
      />
      
      <label style={{ ...styles.label, marginTop: '0.5rem' }}>dataset_id:</label>
      <input
        style={{ ...styles.input, ...styles.inputFull }}
        value={datasetId}
        onChange={e => setDatasetId(e.target.value)}
        placeholder="dataset_id"
      />
      
      <div style={{borderTop: '1px solid #333', margin: '0.75rem 0'}} />

      <div style={styles.title}>
        Экспериментальные функции
      </div>

      <ToggleSwitch
        label="Проактивный ИИ-помощник"
        enabled={isProactiveAgentEnabled}
        setEnabled={setIsProactiveAgentEnabled}
        helpText="Агент анализирует вводимый текст и предлагает подсказки в реальном времени."
      />
      
      <button 
        style={styles.clearButton}
        onMouseOver={e => {
          const target = e.currentTarget;
          target.style.background = '#dc2626';
        }}
        onMouseOut={e => {
          const target = e.currentTarget;
          target.style.background = '#ef4444';
        }}
        onClick={clearHistory}
      >
        Очистить чат
      </button>
    </div>
  );
};

export default Settings; 