import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import styles from './LoadingIndicator.module.css';
const LoadingIndicator = ({ loading, messages }) => {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [stages, setStages] = useState([
        { id: 'query', name: 'Processing query', completed: false, progress: 0 },
        { id: 'request', name: 'Sending request', completed: false, progress: 0 },
        { id: 'search', name: 'Searching documents', completed: false, progress: 0 },
        { id: 'generation', name: 'Generating response', completed: false, progress: 0 }
    ]);
    // Dynamically enable background stages if needed
    useEffect(() => {
        const bg = (window).__bgTasks || {};
        const needFrustration = bg.frustration === 'running';
        setStages(prev => {
            const base = prev.filter(s => !['frustration', 'escalation'].includes(s.id));
            if (needFrustration) {
                return [
                    ...base,
                    { id: 'frustration', name: 'Analyzing frustration', completed: false, progress: 0 },
                    { id: 'escalation', name: 'Escalation processing', completed: false, progress: 0 },
                ];
            }
            return base;
        });
    }, [loading]);
    useEffect(() => {
        if (!loading) {
            // Reset all stages when loading stops
            setCurrentStageIndex(0);
            setStages(prev => prev.map(stage => ({ ...stage, completed: false, progress: 0 })));
            return;
        }
        // Stage progression logic
        const progressInterval = setInterval(() => {
            setStages(prev => {
                const newStages = [...prev];
                const currentStage = newStages[currentStageIndex];
                if (currentStage && !currentStage.completed) {
                    // Increase progress for current stage
                    currentStage.progress = Math.min(100, currentStage.progress + 15);
                    // If stage reaches 100%, mark as completed and move to next stage
                    if (currentStage.progress >= 100) {
                        currentStage.completed = true;
                        // Move to next stage
                        if (currentStageIndex < newStages.length - 1) {
                            setCurrentStageIndex(prev => prev + 1);
                        }
                    }
                }
                return newStages;
            });
        }, 300); // Update every 300ms
        return () => clearInterval(progressInterval);
    }, [loading, currentStageIndex]);
    // Complete 'search' automatically if sources already present
    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.sources && lastMessage.sources.length > 0) {
                setStages(prev => {
                    const newStages = [...prev];
                    const searchStage = newStages.find(s => s.id === 'search');
                    if (searchStage && !searchStage.completed) {
                        searchStage.completed = true;
                        searchStage.progress = 100;
                        // Move to generation stage
                        const generationIndex = newStages.findIndex(s => s.id === 'generation');
                        if (generationIndex !== -1) {
                            setCurrentStageIndex(generationIndex);
                        }
                    }
                    return newStages;
                });
            }
        }
    }, [messages]);
    // Update background stages from global flag
    useEffect(() => {
        const interval = setInterval(() => {
            const bg = (window).__bgTasks || {};
            if (bg.frustration === 'done') {
                setStages(prev => prev.map(s => (s.id === 'frustration' || s.id === 'escalation') ? { ...s, completed: true, progress: 100 } : s));
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);
    if (!loading)
        return null;
    const currentStage = stages[currentStageIndex];
    return (_jsxs("div", { className: styles['elite-loading-container'], children: [_jsxs("div", { className: styles['elite-spinner'], children: [_jsx("div", { className: styles['spinner-ring'] }), _jsx("div", { className: styles['spinner-inner'] })] }), _jsx("div", { className: styles['elite-text-container'], children: _jsx("div", { className: styles['elite-text'], "data-text": currentStage?.name || 'Processing', children: currentStage?.name || 'Processing' }) })] }));
};
export default LoadingIndicator;
