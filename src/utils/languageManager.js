// Multilingual Support System
const translations = {
  en: {
    // Common UI Elements
    home: 'Home',
    play: 'Play',
    settings: 'Settings',
    score: 'Score',
    next: 'Next',
    back: 'Back',
    correct: 'Correct!',
    incorrect: 'Try Again!',
    greatJob: 'Great Job!',
    wellDone: 'Well Done!',
    excellent: 'Excellent!',
    perfect: 'Perfect!',
    
    // Subjects
    phonics: 'Phonics',
    math: 'Math',
    reading: 'Reading',
    spelling: 'Spelling',
    science: 'Science',
    citizenship: 'Citizenship',
    skipCounting: 'Skip Counting',
    art: 'Art',
    geography: 'Geography',
    history: 'History',
    
    // Game Instructions
    dragAndDrop: 'Drag the items to the correct spots!',
    matching: 'Match the items on the left with the correct items on the right!',
    memory: 'Find matching pairs!',
    spellingPractice: 'Write the word 5 times',
    chooseAnswer: 'Choose the correct answer',
    
    // Feedback Messages
    tryAgain: 'Try again!',
    keepGoing: 'Keep going!',
    almostThere: 'Almost there!',
    youGotThis: 'You got this!',
    
    // Settings
    language: 'Language',
    voice: 'Voice',
    sound: 'Sound',
    music: 'Music',
    difficulty: 'Difficulty',
    theme: 'Theme',
    
    // Accessibility
    listenToQuestion: 'Listen to question',
    listenToAnswer: 'Listen to answer',
    listenToWord: 'Listen to word',
    stopAudio: 'Stop audio',
    
    // Progress
    completed: 'Completed',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    streak: 'Streak',
    achievements: 'Achievements',
    
    // Parent Features
    parentMode: 'Parent Mode',
    childProgress: 'Child Progress',
    learningReport: 'Learning Report',
    
    // Common Words
    yes: 'Yes',
    no: 'No',
    start: 'Start',
    finish: 'Finish',
    reset: 'Reset',
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    continue: 'Continue',
    retry: 'Retry'
  },
  
  es: {
    // Common UI Elements
    home: 'Inicio',
    play: 'Jugar',
    settings: 'Configuración',
    score: 'Puntuación',
    next: 'Siguiente',
    back: 'Atrás',
    correct: '¡Correcto!',
    incorrect: '¡Inténtalo de nuevo!',
    greatJob: '¡Buen trabajo!',
    wellDone: '¡Bien hecho!',
    excellent: '¡Excelente!',
    perfect: '¡Perfecto!',
    
    // Subjects
    phonics: 'Fonética',
    math: 'Matemáticas',
    reading: 'Lectura',
    spelling: 'Ortografía',
    science: 'Ciencias',
    citizenship: 'Ciudadanía',
    skipCounting: 'Contar de Saltos',
    art: 'Arte',
    geography: 'Geografía',
    history: 'Historia',
    
    // Game Instructions
    dragAndDrop: '¡Arrastra los elementos a los lugares correctos!',
    matching: '¡Empareja los elementos de la izquierda con los correctos de la derecha!',
    memory: '¡Encuentra las parejas!',
    spellingPractice: 'Escribe la palabra 5 veces',
    chooseAnswer: 'Elige la respuesta correcta',
    
    // Feedback Messages
    tryAgain: '¡Inténtalo de nuevo!',
    keepGoing: '¡Sigue adelante!',
    almostThere: '¡Casi llegas!',
    youGotThis: '¡Tú puedes!',
    
    // Settings
    language: 'Idioma',
    voice: 'Voz',
    sound: 'Sonido',
    music: 'Música',
    difficulty: 'Dificultad',
    theme: 'Tema',
    
    // Accessibility
    listenToQuestion: 'Escuchar pregunta',
    listenToAnswer: 'Escuchar respuesta',
    listenToWord: 'Escuchar palabra',
    stopAudio: 'Detener audio',
    
    // Progress
    completed: 'Completado',
    inProgress: 'En Progreso',
    notStarted: 'No Iniciado',
    streak: 'Racha',
    achievements: 'Logros',
    
    // Parent Features
    parentMode: 'Modo Padre',
    childProgress: 'Progreso del Niño',
    learningReport: 'Reporte de Aprendizaje',
    
    // Common Words
    yes: 'Sí',
    no: 'No',
    start: 'Comenzar',
    finish: 'Terminar',
    reset: 'Reiniciar',
    save: 'Guardar',
    cancel: 'Cancelar',
    done: 'Hecho',
    continue: 'Continuar',
    retry: 'Reintentar'
  },
  
  fr: {
    // Common UI Elements
    home: 'Accueil',
    play: 'Jouer',
    settings: 'Paramètres',
    score: 'Score',
    next: 'Suivant',
    back: 'Retour',
    correct: 'Correct !',
    incorrect: 'Réessayez !',
    greatJob: 'Bon travail !',
    wellDone: 'Bien fait !',
    excellent: 'Excellent !',
    perfect: 'Parfait !',
    
    // Subjects
    phonics: 'Phonétique',
    math: 'Mathématiques',
    reading: 'Lecture',
    spelling: 'Orthographe',
    science: 'Sciences',
    citizenship: 'Citoyenneté',
    skipCounting: 'Compter par Sauts',
    art: 'Art',
    geography: 'Géographie',
    history: 'Histoire',
    
    // Game Instructions
    dragAndDrop: 'Glissez les éléments aux bons endroits !',
    matching: 'Associez les éléments de gauche avec les bons de droite !',
    memory: 'Trouvez les paires !',
    spellingPractice: 'Écrivez le mot 5 fois',
    chooseAnswer: 'Choisissez la bonne réponse',
    
    // Feedback Messages
    tryAgain: 'Réessayez !',
    keepGoing: 'Continuez !',
    almostThere: 'Presque là !',
    youGotThis: 'Vous pouvez le faire !',
    
    // Settings
    language: 'Langue',
    voice: 'Voix',
    sound: 'Son',
    music: 'Musique',
    difficulty: 'Difficulté',
    theme: 'Thème',
    
    // Accessibility
    listenToQuestion: 'Écouter la question',
    listenToAnswer: 'Écouter la réponse',
    listenToWord: 'Écouter le mot',
    stopAudio: 'Arrêter l\'audio',
    
    // Progress
    completed: 'Terminé',
    inProgress: 'En Cours',
    notStarted: 'Pas Commencé',
    streak: 'Série',
    achievements: 'Réalisations',
    
    // Parent Features
    parentMode: 'Mode Parent',
    childProgress: 'Progrès de l\'Enfant',
    learningReport: 'Rapport d\'Apprentissage',
    
    // Common Words
    yes: 'Oui',
    no: 'Non',
    start: 'Commencer',
    finish: 'Terminer',
    reset: 'Réinitialiser',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    done: 'Fait',
    continue: 'Continuer',
    retry: 'Réessayer'
  },
  
  zh: {
    // Common UI Elements
    home: '首页',
    play: '游戏',
    settings: '设置',
    score: '分数',
    next: '下一个',
    back: '返回',
    correct: '正确！',
    incorrect: '再试一次！',
    greatJob: '做得好！',
    wellDone: '很好！',
    excellent: '优秀！',
    perfect: '完美！',
    
    // Subjects
    phonics: '语音',
    math: '数学',
    reading: '阅读',
    spelling: '拼写',
    science: '科学',
    citizenship: '公民教育',
    skipCounting: '跳数',
    art: '艺术',
    geography: '地理',
    history: '历史',
    
    // Game Instructions
    dragAndDrop: '将物品拖到正确的位置！',
    matching: '将左边的物品与右边正确的物品匹配！',
    memory: '找到匹配的对！',
    spellingPractice: '写单词5次',
    chooseAnswer: '选择正确答案',
    
    // Feedback Messages
    tryAgain: '再试一次！',
    keepGoing: '继续！',
    almostThere: '快到了！',
    youGotThis: '你能做到！',
    
    // Settings
    language: '语言',
    voice: '声音',
    sound: '音效',
    music: '音乐',
    difficulty: '难度',
    theme: '主题',
    
    // Accessibility
    listenToQuestion: '听问题',
    listenToAnswer: '听答案',
    listenToWord: '听单词',
    stopAudio: '停止音频',
    
    // Progress
    completed: '已完成',
    inProgress: '进行中',
    notStarted: '未开始',
    streak: '连胜',
    achievements: '成就',
    
    // Parent Features
    parentMode: '家长模式',
    childProgress: '孩子进度',
    learningReport: '学习报告',
    
    // Common Words
    yes: '是',
    no: '否',
    start: '开始',
    finish: '完成',
    reset: '重置',
    save: '保存',
    cancel: '取消',
    done: '完成',
    continue: '继续',
    retry: '重试'
  }
};

// Language Detection and Management
class LanguageManager {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.fallbackLanguage = 'en';
  }

  detectLanguage() {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('emmy-learning-language');
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }

    // Check browser language
    const browserLanguage = navigator.language.split('-')[0];
    if (translations[browserLanguage]) {
      return browserLanguage;
    }

    // Check browser languages array
    const browserLanguages = navigator.languages.map(lang => lang.split('-')[0]);
    for (const lang of browserLanguages) {
      if (translations[lang]) {
        return lang;
      }
    }

    // Default to English
    return 'en';
  }

  setLanguage(languageCode) {
    if (translations[languageCode]) {
      this.currentLanguage = languageCode;
      localStorage.setItem('emmy-learning-language', languageCode);
      
      // Update document language
      document.documentElement.lang = languageCode;
      
      // Dispatch language change event
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: languageCode }
      }));
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.keys(translations).map(code => ({
      code,
      name: this.getLanguageName(code),
      nativeName: this.getNativeLanguageName(code)
    }));
  }

  getLanguageName(code) {
    const names = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      zh: 'Chinese'
    };
    return names[code] || code;
  }

  getNativeLanguageName(code) {
    const names = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      zh: '中文'
    };
    return names[code] || code;
  }

  translate(key, params = {}) {
    const translation = translations[this.currentLanguage]?.[key] || 
                       translations[this.fallbackLanguage]?.[key] || 
                       key;

    // Simple parameter replacement
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }

  // Get all translations for a specific language
  getTranslations(languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    return translations[lang] || translations[this.fallbackLanguage];
  }

  // Check if a language is RTL (Right-to-Left)
  isRTL(languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(lang);
  }

  // Get text direction
  getTextDirection(languageCode = null) {
    return this.isRTL(languageCode) ? 'rtl' : 'ltr';
  }
}

// Create singleton instance
const languageManager = new LanguageManager();

// React Hook for translations
export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState(languageManager.getLanguage());

  React.useEffect(() => {
    const handleLanguageChange = (event) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const t = (key, params = {}) => languageManager.translate(key, params);
  const changeLanguage = (languageCode) => languageManager.setLanguage(languageCode);
  const getAvailableLanguages = () => languageManager.getAvailableLanguages();

  return {
    t,
    currentLanguage,
    changeLanguage,
    getAvailableLanguages,
    isRTL: languageManager.isRTL(),
    textDirection: languageManager.getTextDirection()
  };
};

// Higher-order component for translation
export const withTranslation = (Component) => {
  return (props) => {
    const translation = useTranslation();
    return <Component {...props} {...translation} />;
  };
};

export default languageManager;
