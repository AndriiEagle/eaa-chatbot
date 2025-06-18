import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import './EAAThinkingAnimation.css';
// РАСШИРЕННЫЕ процессы мышления ИИ с терминологией EAA (вдохновлено Opera AI)
const THINKING_STAGES = {
    analyzing: [
        "🔍 Анализирую контекст вашего запроса о веб-доступности...",
        "📋 Классифицирую тип запроса в соответствии с EAA...",
        "🎯 Определяю область применения Европейского Акта...",
        "🧠 Активирую экспертные модули по WCAG и доступности...",
        "📊 Оцениваю сложность и приоритет вашего запроса..."
    ],
    searching: [
        "📚 Сканирую 282 документа по веб-доступности в векторной БД...",
        "🔎 Применяю семантический поиск по базе знаний EAA...",
        "⚡ Использую косинусное сходство для поиска релевантных фрагментов...",
        "🎯 Ранжирую найденные источники по релевантности...",
        "📖 Извлекаю ключевые положения Акта о Доступности...",
        "🔗 Сопоставляю с требованиями WCAG 2.1/2.2..."
    ],
    processing: [
        "🧮 Обрабатываю найденную информацию через RAG-pipeline...",
        "🔗 Интегрирую данные из множественных источников EAA...",
        "📊 Анализирую применимость к вашему конкретному случаю...",
        "🎨 Формирую структурированный экспертный ответ...",
        "⚖️ Сопоставляю с правовыми требованиями ЕС...",
        "🎯 Персонализирую под ваш уровень технической подготовки..."
    ],
    generating: [
        "✍️ Генерирую экспертный ответ с использованием GPT-4o-mini...",
        "🎯 Адаптирую стиль под специфику веб-доступности...",
        "📝 Добавляю практические рекомендации и примеры кода...",
        "🔧 Включаю пошаговые инструкции по реализации...",
        "📋 Формирую checklist для проверки соответствия...",
        "🌟 Обогащаю ответ ссылками на официальные источники..."
    ],
    finalizing: [
        "✨ Финализирую экспертное заключение по EAA...",
        "🎯 Проверяю полноту охвата вашего запроса...",
        "📋 Добавляю метаданные и confidence score...",
        "🔗 Вставляю ссылки на первоисточники и документы...",
        "🚀 Подготавливаю к отправке с проверкой качества!",
        "🎉 Готово! Отправляю профессиональный ответ..."
    ]
};
const EAAThinkingAnimation = ({ isVisible, stage = 'analyzing', onComplete }) => {
    const [currentStageTexts, setCurrentStageTexts] = useState([]);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [showHighlight, setShowHighlight] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stageProgress, setStageProgress] = useState(0);
    const textRef = useRef(null);
    // Инициализация текстов для текущей стадии
    useEffect(() => {
        if (isVisible && THINKING_STAGES[stage]) {
            setCurrentStageTexts(THINKING_STAGES[stage]);
            setCurrentTextIndex(0);
            setProgress(0);
            setStageProgress(0);
        }
    }, [isVisible, stage]);
    // Логика смены текстов (быстрее, как в Opera AI)
    useEffect(() => {
        if (!isVisible || currentStageTexts.length === 0)
            return;
        const interval = setInterval(() => {
            const nextIndex = (currentTextIndex + 1) % currentStageTexts.length;
            setCurrentTextIndex(nextIndex);
            // Прогресс внутри стадии
            const stageProgressValue = ((nextIndex + 1) / currentStageTexts.length) * 100;
            setStageProgress(stageProgressValue);
            // Общий прогресс (для всех стадий)
            setProgress((nextIndex / currentStageTexts.length) * 100);
            // Завершение анимации
            if (nextIndex === 0 && currentTextIndex > 0 && onComplete) {
                setTimeout(() => onComplete(), 1000);
            }
        }, 2000); // Ускорили до 2 секунд как в Opera
        return () => clearInterval(interval);
    }, [isVisible, currentTextIndex, currentStageTexts, onComplete]);
    // Обновление текущего текста с эффектом подсветки
    useEffect(() => {
        if (currentStageTexts[currentTextIndex]) {
            setCurrentText(currentStageTexts[currentTextIndex]);
            setShowHighlight(true);
            // Солнечный эффект длится дольше
            const timer = setTimeout(() => setShowHighlight(false), 1800);
            return () => clearTimeout(timer);
        }
    }, [currentTextIndex, currentStageTexts]);
    if (!isVisible)
        return null;
    return (_jsxs("div", { className: "eaa-thinking-container", role: "status", "aria-live": "polite", "aria-label": `ИИ обрабатывает ваш запрос: ${stage}`, children: [_jsxs("div", { className: "eaa-stage-indicator", children: [_jsxs("div", { className: "eaa-stage-title", children: [stage === 'analyzing' && '🔍 Анализ запроса', stage === 'searching' && '📚 Поиск в базе EAA', stage === 'processing' && '🧮 Обработка данных', stage === 'generating' && '✍️ Генерация ответа', stage === 'finalizing' && '✨ Финализация'] }), _jsx("div", { className: "eaa-mini-progress", children: _jsx("div", { className: "eaa-mini-progress-bar", style: { width: `${stageProgress}%` } }) })] }), _jsxs("div", { className: "eaa-orbital-system", children: [_jsxs("div", { className: "eaa-central-core", children: [_jsx("div", { className: "eaa-pulse-ring" }), _jsx("div", { className: "eaa-pulse-ring-2" }), _jsx("div", { className: "eaa-core-icon", children: "\uD83E\uDDE0" })] }), [1, 2, 3, 4, 5].map(num => (_jsx("div", { className: `eaa-orbital eaa-orbital-${num}`, children: _jsxs("div", { className: "eaa-orbital-dot", children: [num === 1 && '♿', "  ", num === 2 && '🔍', "  ", num === 3 && '⚡', "  ", num === 4 && '🎯', "  ", num === 5 && '✨', "  "] }) }, num))), _jsx("div", { className: "eaa-orbital-ring eaa-ring-1" }), _jsx("div", { className: "eaa-orbital-ring eaa-ring-2" }), _jsx("div", { className: "eaa-orbital-ring eaa-ring-3" })] }), _jsxs("div", { className: "eaa-thinking-text-container", children: [_jsxs("div", { ref: textRef, className: `eaa-thinking-text ${showHighlight ? 'highlighted' : ''}`, children: [currentText, showHighlight && (_jsxs(_Fragment, { children: [_jsx("div", { className: "eaa-sun-highlight", "aria-hidden": "true" }), _jsx("div", { className: "eaa-sun-highlight-2", "aria-hidden": "true" })] }))] }), _jsxs("div", { className: "eaa-progress-container", children: [_jsxs("div", { className: "eaa-progress-label", children: ["\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441: ", Math.round(progress), "%"] }), _jsx("div", { className: "eaa-progress-bar", style: { width: `${progress}%` }, "aria-label": `Прогресс обработки: ${Math.round(progress)}%` })] })] }), _jsxs("div", { className: "eaa-thinking-effects", children: [[...Array(8)].map((_, i) => (_jsx("div", { className: `eaa-particle eaa-particle-${i + 1}`, "aria-hidden": "true" }, i))), _jsx("div", { className: "eaa-wave-1", "aria-hidden": "true" }), _jsx("div", { className: "eaa-wave-2", "aria-hidden": "true" }), _jsx("div", { className: "eaa-wave-3", "aria-hidden": "true" }), _jsx("div", { className: "eaa-wave-4", "aria-hidden": "true" })] }), _jsxs("div", { className: "eaa-glow-effects", children: [_jsx("div", { className: "eaa-ambient-glow" }), _jsx("div", { className: "eaa-focused-glow" })] }), _jsxs("div", { className: "sr-only", "aria-live": "polite", children: ["\u0421\u0442\u0430\u0434\u0438\u044F ", stage, ": ", currentText] })] }));
};
export default EAAThinkingAnimation;
