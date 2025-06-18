import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface LoadingIndicatorProps {
  loading: boolean;
  messages: Message[];
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loading, messages }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);

  const steps = [
    { name: "Отправка запроса", duration: 500 },
    { name: "Поиск документов", duration: 2000 },
    { name: "Генерация ответа", duration: 3000 }
  ];

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setCurrentStep(0);
      setAnimationFrame(0);
      return;
    }

    let startTime = Date.now();
    let animationId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Определяем текущий шаг
      let totalDuration = 0;
      let newStep = 0;
      
      for (let i = 0; i < steps.length; i++) {
        if (elapsed < totalDuration + steps[i].duration) {
          newStep = i;
          break;
        }
        totalDuration += steps[i].duration;
        newStep = i + 1;
      }
      
      setCurrentStep(Math.min(newStep, steps.length - 1));
      
      // Рассчитываем прогресс
      const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
      const newProgress = Math.min((elapsed / totalTime) * 100, 95); // Максимум 95% до завершения
      setProgress(newProgress);
      
      // Анимация мерцания
      setAnimationFrame(prev => (prev + 1) % 60);
      
      if (loading && newProgress < 95) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [loading]);

  // Завершаем прогресс, когда получаем ответ
  useEffect(() => {
    if (!loading && progress > 0) {
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setCurrentStep(0);
      }, 500);
    }
  }, [loading, progress]);

  if (!loading && progress === 0) {
    return null;
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        
        @keyframes progress-fill {
          0% { width: 0%; }
          100% { width: ${progress}%; }
        }
        
        .shimmer-text {
          background: linear-gradient(90deg, #9ca3af 25%, #3b82f6 50%, #9ca3af 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        fontSize: '0.8rem',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginLeft: '0.5rem',
        marginTop: '0.25rem',
        minWidth: '200px'
      }}>
        {/* Заголовок с прогрессом */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.25rem'
        }}>
          <span style={{ 
            color: '#e5e7eb', 
            fontWeight: '600',
            fontSize: '0.75rem'
          }}>
            Обработка запроса
          </span>
          <span style={{ 
            color: '#3b82f6', 
            fontWeight: '700',
            fontSize: '0.75rem'
          }}>
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Прогресс бар */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(55, 65, 81, 0.8)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '2px',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
          }} />
        </div>
        
        {/* Этапы */}
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStepColor(status),
                flexShrink: 0,
                animation: isActive ? 'pulse-dot 1s infinite' : 'none',
                boxShadow: isActive ? `0 0 8px ${getStepColor(status)}` : 'none'
              }} />
              
              <span 
                className={isActive ? 'shimmer-text' : ''}
                style={{
                  color: isCompleted ? '#10b981' : (isActive ? '#3b82f6' : '#9ca3af'),
                  fontSize: '0.75rem',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'color 0.3s ease'
                }}
              >
                {step.name}
              </span>
              
              {isCompleted && (
                <span style={{ 
                  color: '#10b981', 
                  fontSize: '0.7rem',
                  marginLeft: 'auto'
                }}>
                  ✓
                </span>
              )}
              
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: '2px'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      animation: `pulse-dot 1s infinite ${i * 0.2}s`
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default LoadingIndicator; 