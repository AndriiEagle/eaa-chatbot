import React, { useState } from 'react';
import { SourcesListProps } from '../types';
import { getRelevanceColor } from '../utils/stringUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const INITIAL_VISIBLE_SOURCES = 3;
/**
 * Компонент для отображения списка источников с их релевантностью и дополнительной информацией
 */
const SourcesList: React.FC<SourcesListProps> = ({ sources, containerStyles }) => {
  // Состояние для хранения ID источника, над которым наведен курсор
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }
  
  const visibleSources = isExpanded ? sources : sources.slice(0, INITIAL_VISIBLE_SOURCES);

  // Логируем для отладки
  console.log(`[SourcesList] Отображаю ${sources.length} источников:`, sources);

  return (
    <div 
      style={{ 
        marginTop: '0.75rem', 
        fontSize: '0.75rem', 
        color: '#9ca3af', 
        paddingTop: '0.75rem', 
        borderTop: '1px solid #4b5563',
        ...containerStyles 
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
        Sources ({sources.length}):
      </div>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        marginTop: '0.5rem' 
      }}>
        {visibleSources.map((source, idx) => (
          <div 
            key={idx} 
            style={{ 
              flex: '0 0 33.333%', 
              marginBottom: '0.5rem' 
            }}
            onMouseEnter={() => source.id && setHoveredSourceId(source.id)}
            onMouseLeave={() => setHoveredSourceId(null)}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '0.25rem' 
            }}>
              <div style={{ 
                minWidth: '1.5rem', 
                marginRight: '0.5rem', 
                textAlign: 'right', 
                color: '#a78bfa', 
                fontWeight: 'bold' 
              }}>
                {idx + 1}.
              </div>
              <div style={{ 
                flex: 1, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                <span
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px dotted #a78bfa'
                  }}
                  title={source.text_preview || 'No preview available'}
                >
                  {source.title || `Source ${idx + 1}`}
                </span>
                <span style={{ 
                  marginLeft: '0.5rem',
                  color: getRelevanceColor(source.relevance),
                  fontFamily: 'monospace'
                }}>
                  {(source.relevance * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Отображаем превью источника при наведении */}
            {hoveredSourceId === source.id && source.text_preview && (
              <div style={{
                backgroundColor: '#2d3748',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                padding: '0.5rem',
                marginLeft: '2rem',
                marginRight: '0.5rem',
                fontSize: '0.7rem',
                color: '#e2e8f0',
                maxHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                position: 'relative'
              }}>
                {source.text_preview}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '20px',
                  background: 'linear-gradient(transparent, #2d3748)'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {sources.length > INITIAL_VISIBLE_SOURCES && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: '1px solid #4b5563',
            color: '#d1d5db',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.75rem'
          }}
        >
          {isExpanded ? 'Свернуть' : `Показать ещё ${sources.length - INITIAL_VISIBLE_SOURCES}`}
          {isExpanded 
            ? <ChevronUp size={14} style={{ marginLeft: '0.25rem' }} /> 
            : <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
          }
        </button>
      )}
    </div>
  );
};

export default SourcesList; 