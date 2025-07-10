// Loading indicator phrases
export const loaderPhrases = [
  '⚙️ Warming up my brain, please wait.',
  '🧠 One second, consulting with Satan.',
  '📡 Catching signal from hell...',
  '🕳 Choosing words to make you uncomfortable.',
  '🧬 Generating heresy at molecular level.',
  '⏳ Your mother waited 9 months for you, now you wait.',
  '💉 Mixing toxin of wit.',
  '💀 Processing data as if you said something worthwhile.',
  '🦴 Just kidding, I already know everything, just building drama.',
  '⚰️ Bot is thinking... Meanwhile, think about why you exist.'
];

// Copy notification phrases
export const copyPhrases = [
  '📎 Delivering knowledge to this leather bag.',
  '🧠 Cloning completed, pathetic creature.',
  '🎯 Yes, you clicked. Great genius you are!',
  '💉 Injected you with truth, hold on.',
  '📤 Your ego already put this in resume.',
  '🦍 Clicked? Good job, chimp with motor skills!',
  '📦 Carried to cave, master.',
  '💾 Saved on hell\'s floppy disk.',
  '📎 Well, another byte in favor of idiocracy.',
  '🧨 Copy done. Still no brains though.'
];

// Default settings
export const defaultSettings = {
  datasetId: localStorage.getItem('dataset_id') || '',
  threshold: parseFloat(localStorage.getItem('similarity_threshold') || '0.7'),
  maxChunks: parseInt(localStorage.getItem('max_chunks') || '5')
}; 