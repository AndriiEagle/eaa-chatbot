// Фразы для индикатора загрузки
export const loaderPhrases = [
  '⚙️ Грею извилины, потерпи.',
  '🧠 Секунду, консультируюсь с сатаной.',
  '📡 Ловлю сигнал из преисподней...',
  '🕳 Подбираю слова, чтоб тебе стало неловко.',
  '🧬 Генерирую ересь на молекулярном уровне.',
  '⏳ Твоя мать ждала тебя 9 месяцев, подожди и ты.',
  '💉 Подмешиваю токсин остроумия.',
  '💀 Обрабатываю данные, как будто ты что-то стоящее сказал.',
  '🦴 Шучу, я уже всё знаю, просто драму нагнетаю.',
  '⚰️ Бот думает... А ты пока подумай, зачем ты живёшь.'
];

// Фразы для уведомления о копировании
export const copyPhrases = [
  '📎 Выдаю базу этому кожаному мешку.',
  '🧠 Клонирование завершено, жалкое создание.',
  '🎯 Да, ты нажал. Великий ты мой гений!',
  '💉 Впрыснул тебе истину, держись.',
  '📤 Твоё эго уже вставило это в резюме.',
  '🦍 Нажал? Молодец, шимпанзе с моторикой!',
  '📦 Унёс в пещеру, хозяин.',
  '💾 Записал на дискета из ада.',
  '📎 Ну вот, ещё один байт в пользу идиократии.',
  '🧨 Копия есть. Мозгов всё так же нет.'
];

// Настройки по умолчанию
export const defaultSettings = {
  datasetId: localStorage.getItem('dataset_id') || '',
  threshold: parseFloat(localStorage.getItem('similarity_threshold') || '0.7'),
  maxChunks: parseInt(localStorage.getItem('max_chunks') || '5')
}; 