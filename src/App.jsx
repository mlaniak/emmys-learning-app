import React, { useState, useRef, useEffect } from 'react';

const EmmyStudyGame = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const [answerAnimation, setAnswerAnimation] = useState('');
  const [drawColor, setDrawColor] = useState('#8B5CF6');
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [showAchievement, setShowAchievement] = useState(null);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('emmy-learning-progress');
    return saved ? JSON.parse(saved) : {
      completedSubjects: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null,
      achievements: [],
      unlockedThemes: ['default'],
      selectedTheme: 'default',
      avatar: 'default',
      certificates: [],
      stats: {
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        perfectScores: 0,
        timeSpent: 0,
        favoriteSubject: null
      }
    };
  });

  // Haptic feedback for mobile devices
  const triggerHaptic = (type = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 10, 10],
        error: [50, 50, 50]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  };

  // Save progress to localStorage
  const saveProgress = (newProgress) => {
    setProgress(newProgress);
    localStorage.setItem('emmy-learning-progress', JSON.stringify(newProgress));
  };

  // Check and unlock achievements
  const checkAchievements = (newProgress) => {
    const newAchievements = [];
    const currentAchievements = newProgress.achievements || [];
    
    // First Steps - Complete first question
    if (newProgress.stats.totalQuestionsAnswered >= 1 && !currentAchievements.includes('first_steps')) {
      newAchievements.push('first_steps');
    }
    
    // Perfect Score - Get 100% on any subject
    Object.values(newProgress.completedSubjects).forEach(subject => {
      if (subject.score === 100 && !currentAchievements.includes('perfect_score')) {
        newAchievements.push('perfect_score');
      }
    });
    
    // Subject Master - Complete all questions in a subject
    const completedSubjects = Object.keys(newProgress.completedSubjects).length;
    if (completedSubjects >= 1 && !currentAchievements.includes('subject_master')) {
      newAchievements.push('subject_master');
    }
    
    // Scholar - Complete 5 different subjects
    if (completedSubjects >= 5 && !currentAchievements.includes('scholar')) {
      newAchievements.push('scholar');
    }
    
    // Perfectionist - Get perfect scores on 3 subjects
    const perfectScores = Object.values(newProgress.completedSubjects).filter(s => s.score === 100).length;
    if (perfectScores >= 3 && !currentAchievements.includes('perfectionist')) {
      newAchievements.push('perfectionist');
    }
    
    // Marathon Runner - Answer 50 questions in one session
    if (newProgress.stats.totalQuestionsAnswered >= 50 && !currentAchievements.includes('marathon_runner')) {
      newAchievements.push('marathon_runner');
    }
    
    // Time-based achievements
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 8 && !currentAchievements.includes('early_bird')) {
      newAchievements.push('early_bird');
    }
    if (hour >= 20 && !currentAchievements.includes('night_owl')) {
      newAchievements.push('night_owl');
    }
    
    // Subject-specific achievements
    if (newProgress.completedSubjects.spelling && !currentAchievements.includes('artist')) {
      newAchievements.push('artist');
    }
    if (newProgress.completedSubjects.science && !currentAchievements.includes('scientist')) {
      newAchievements.push('scientist');
    }
    if (newProgress.completedSubjects.math && !currentAchievements.includes('mathematician')) {
      newAchievements.push('mathematician');
    }
    if (newProgress.completedSubjects.reading && !currentAchievements.includes('reader')) {
      newAchievements.push('reader');
    }
    if (newProgress.completedSubjects.social && !currentAchievements.includes('citizen')) {
      newAchievements.push('citizen');
    }
    if (newProgress.completedSubjects.skipcounting && !currentAchievements.includes('counter')) {
      newAchievements.push('counter');
    }
    if (newProgress.completedSubjects.phonics && !currentAchievements.includes('phonics_master')) {
      newAchievements.push('phonics_master');
    }
    
    // Grand Master - Complete ALL subjects with perfect scores
    const allSubjects = ['phonics', 'math', 'reading', 'spelling', 'science', 'social', 'skipcounting', 'art', 'geography', 'history'];
    const allPerfect = allSubjects.every(subject => 
      newProgress.completedSubjects[subject] && newProgress.completedSubjects[subject].score === 100
    );
    if (allPerfect && !currentAchievements.includes('grand_master')) {
      newAchievements.push('grand_master');
    }
    
    // Update progress with new achievements
    if (newAchievements.length > 0) {
      const updatedProgress = {
        ...newProgress,
        achievements: [...currentAchievements, ...newAchievements]
      };
      
      // Show achievement notification
      if (newAchievements.length === 1) {
        setShowAchievement(achievements[newAchievements[0]]);
        setTimeout(() => setShowAchievement(null), 3000);
      }
      
      return updatedProgress;
    }
    
    return newProgress;
  };

  // Check and unlock themes/avatars
  const checkUnlocks = (newProgress) => {
    const unlockedThemes = [...(newProgress.unlockedThemes || ['default'])];
    const unlockedAvatars = [...(newProgress.unlockedAvatars || ['default'])];
    
    // Theme unlocks
    const completedSubjects = Object.keys(newProgress.completedSubjects).length;
    if (completedSubjects >= 3 && !unlockedThemes.includes('ocean')) {
      unlockedThemes.push('ocean');
    }
    
    const perfectScores = Object.values(newProgress.completedSubjects).filter(s => s.score === 100).length;
    if (perfectScores >= 5 && !unlockedThemes.includes('forest')) {
      unlockedThemes.push('forest');
    }
    
    if (newProgress.stats.totalQuestionsAnswered >= 100 && !unlockedThemes.includes('space')) {
      unlockedThemes.push('space');
    }
    
    // Avatar unlocks
    if (completedSubjects >= 2 && !unlockedAvatars.includes('robot')) {
      unlockedAvatars.push('robot');
    }
    if (perfectScores >= 3 && !unlockedAvatars.includes('princess')) {
      unlockedAvatars.push('princess');
    }
    if (newProgress.stats.totalQuestionsAnswered >= 50 && !unlockedAvatars.includes('superhero')) {
      unlockedAvatars.push('superhero');
    }
    if (completedSubjects >= 7 && !unlockedAvatars.includes('astronaut')) {
      unlockedAvatars.push('astronaut');
    }
    
    return {
      ...newProgress,
      unlockedThemes,
      unlockedAvatars
    };
  };

  const phonicsQuestions = {
    easy: [
    { word: 'then', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '⏰' },
    { word: 'show', question: 'Does this word have SH or TH?', options: ['SH', 'TH'], correct: 'SH', image: '👁️' },
    { word: 'chair', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🪑' },
    { word: 'duck', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🦆' },
      { word: 'ship', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🚢' }
    ],
    medium: [
    { word: 'when', question: 'Does this word have WH or TH?', options: ['WH', 'TH'], correct: 'WH', image: '🕐' },
    { word: 'think', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '🧠' },
    { word: 'phone', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📞' },
    { word: 'whip', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🥊' },
      { word: 'thick', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '📚' },
      { word: 'brush', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🪥' },
      { word: 'cheese', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧀' }
    ],
    hard: [
      { word: 'photo', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📷' },
      { word: 'which', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '❓' },
      { word: 'black', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '⚫' },
      { word: 'through', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🚪' },
      { word: 'machine', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '⚙️' },
      { word: 'graph', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📊' },
      { word: 'wheat', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🌾' },
      { word: 'knock', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🚪' }
    ]
  };

  const mathQuestions = {
    easy: [
      { question: 'What is 2 + 3?', options: ['4', '5'], correct: '5', emoji: '➕' },
      { question: 'What is 7 - 2?', options: ['4', '5'], correct: '5', emoji: '➖' },
      { question: 'Which is bigger: 5 or 3?', options: ['5', '3'], correct: '5', emoji: '🔢' },
      { question: 'How many fingers on one hand?', options: ['4', '5'], correct: '5', emoji: '✋' },
      { question: 'What is 1 + 1?', options: ['2', '3'], correct: '2', emoji: '➕' }
    ],
    medium: [
    { question: 'Which number is GREATER?', options: ['47', '52'], correct: '52', emoji: '🔢' },
    { question: 'How many tens in 45?', options: ['4', '5'], correct: '4', emoji: '🎯' },
    { question: 'What is 5 + 3?', options: ['7', '8'], correct: '8', emoji: '➕' },
    { question: 'What is 12 - 4?', options: ['7', '8'], correct: '8', emoji: '➖' },
    { question: 'How many ones in 23?', options: ['2', '3'], correct: '3', emoji: '🎯' },
    { question: 'What is 6 + 7?', options: ['12', '13'], correct: '13', emoji: '➕' },
      { question: 'What is 15 - 8?', options: ['6', '7'], correct: '7', emoji: '➖' }
    ],
    hard: [
      { question: 'Which is greater: 67 or 76?', options: ['67', '76'], correct: '76', emoji: '🔢' },
      { question: 'Which is smaller: 34 or 43?', options: ['34', '43'], correct: '34', emoji: '🔢' },
      { question: 'How many tens in 78?', options: ['7', '8'], correct: '7', emoji: '🎯' },
      { question: 'What is 9 + 4?', options: ['12', '13'], correct: '13', emoji: '➕' },
      { question: 'What is 20 - 6?', options: ['13', '14'], correct: '14', emoji: '➖' },
      { question: 'Which is greater: 89 or 98?', options: ['89', '98'], correct: '98', emoji: '🔢' },
      { question: 'How many ones in 56?', options: ['5', '6'], correct: '6', emoji: '🎯' },
      { question: 'What is 3 + 8?', options: ['10', '11'], correct: '11', emoji: '➕' },
      { question: 'What is 25 + 17?', options: ['41', '42'], correct: '42', emoji: '➕' },
      { question: 'What is 50 - 23?', options: ['26', '27'], correct: '27', emoji: '➖' }
    ]
  };

  const readingQuestions = [
    { question: 'WHO is in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👥' },
    { question: 'WHERE does the story happen?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏠' },
    { question: 'WHAT is the problem in the story?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '😰' },
    { question: 'HOW is the problem solved?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '✅' },
    { question: 'WHEN does the story happen?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '⏰' },
    { question: 'WHO is the main character?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👤' },
    { question: 'WHAT happens at the beginning?', answer: 'Beginning', options: ['Beginning', 'Middle', 'End'], emoji: '🌅' },
    { question: 'WHAT happens at the end?', answer: 'End', options: ['Beginning', 'Middle', 'End'], emoji: '🌅' }
  ];

  const spellingWords = [
    { word: 'than', hint: 'compare two things' }, { word: 'think', hint: 'use your brain' },
    { word: 'when', hint: 'what time?' }, { word: 'find', hint: 'look for it' },
    { word: 'chair', hint: 'sit on this' }, { word: 'phone', hint: 'call someone' },
    { word: 'duck', hint: 'quack quack' }, { word: 'ship', hint: 'sails on water' },
    { word: 'whip', hint: 'crack the whip' }, { word: 'thick', hint: 'not thin' }
  ];

  const scienceQuestions = [
    { question: 'A system is made of many...', options: ['Parts', 'Colors'], correct: 'Parts', emoji: '🔧', explanation: 'Systems are made of parts that work together!' },
    { question: 'A whole object is made of organized...', options: ['Parts', 'Water'], correct: 'Parts', emoji: '⚙️', explanation: 'All parts work together as a system!' },
    { question: 'What do plants need to grow?', options: ['Sunlight', 'Darkness'], correct: 'Sunlight', emoji: '☀️', explanation: 'Plants need sunlight to make their own food!' },
    { question: 'What do animals need to survive?', options: ['Food', 'Nothing'], correct: 'Food', emoji: '🍎', explanation: 'All animals need food to stay alive!' },
    { question: 'What happens to water when it gets cold?', options: ['It freezes', 'It disappears'], correct: 'It freezes', emoji: '❄️', explanation: 'Water turns to ice when it gets very cold!' },
    { question: 'What do we call the air around Earth?', options: ['Atmosphere', 'Space'], correct: 'Atmosphere', emoji: '🌍', explanation: 'The atmosphere is the air that surrounds our planet!' },
    { question: 'What do we call water falling from clouds?', options: ['Rain', 'Snow'], correct: 'Rain', emoji: '🌧️', explanation: 'Rain is water that falls from clouds!' }
  ];

  const socialStudiesQuestions = [
    { question: 'Being a good citizen means being...', options: ['Respectful', 'Rude'], correct: 'Respectful', emoji: '🤝', explanation: 'Good citizens treat everyone with respect!' },
    { question: 'Benjamin Franklin was a good citizen who...', options: ['Helped his community', 'Stayed home'], correct: 'Helped his community', emoji: '👨', explanation: 'He helped America and his community!' },
    { question: 'What should you do if you see someone being hurt?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens help others who need it!' },
    { question: 'What should you do with trash?', options: ['Throw it away', 'Leave it on the ground'], correct: 'Throw it away', emoji: '🗑️', explanation: 'Keep our community clean by throwing away trash!' },
    { question: 'What should you do when someone is talking?', options: ['Listen', 'Interrupt'], correct: 'Listen', emoji: '👂', explanation: 'Good citizens listen when others are speaking!' },
    { question: 'What should you do if you make a mistake?', options: ['Say sorry', 'Blame others'], correct: 'Say sorry', emoji: '😔', explanation: 'Good citizens take responsibility for their actions!' },
    { question: 'What should you do if you see someone alone?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '🤗', explanation: 'Good citizens make sure everyone feels included!' }
  ];

  const skipCountingQuestions = [
    { question: 'Count by 2s: 2, 4, 6, __', options: ['8', '7'], correct: '8', emoji: '➕' },
    { question: 'Count by 5s: 5, 10, 15, __', options: ['20', '16'], correct: '20', emoji: '✋' },
    { question: 'Count by 10s: 10, 20, 30, __', options: ['40', '35'], correct: '40', emoji: '🔟' },
    { question: 'Count by 2s: 8, 10, 12, __', options: ['14', '13'], correct: '14', emoji: '➕' },
    { question: 'Count by 5s: 20, 25, 30, __', options: ['35', '32'], correct: '35', emoji: '✋' },
    { question: 'Count by 10s: 40, 50, 60, __', options: ['70', '65'], correct: '70', emoji: '🔟' },
    { question: 'Count by 2s: 14, 16, 18, __', options: ['20', '19'], correct: '20', emoji: '➕' },
    { question: 'Count by 5s: 35, 40, 45, __', options: ['50', '48'], correct: '50', emoji: '✋' },
    { question: 'Count by 10s: 70, 80, 90, __', options: ['100', '95'], correct: '100', emoji: '🔟' }
  ];

  // New subjects: Art, Geography, History
  const artQuestions = [
    { question: 'What are the three primary colors?', options: ['Red, Blue, Yellow', 'Red, Green, Blue'], correct: 'Red, Blue, Yellow', emoji: '🎨', explanation: 'Red, Blue, and Yellow are the primary colors that can make all other colors!' },
    { question: 'What do you get when you mix red and blue?', options: ['Purple', 'Green'], correct: 'Purple', emoji: '🟣', explanation: 'Red and blue make purple when mixed together!' },
    { question: 'What do you get when you mix yellow and blue?', options: ['Green', 'Orange'], correct: 'Green', emoji: '🟢', explanation: 'Yellow and blue make green when mixed together!' },
    { question: 'What do you get when you mix red and yellow?', options: ['Orange', 'Purple'], correct: 'Orange', emoji: '🟠', explanation: 'Red and yellow make orange when mixed together!' },
    { question: 'What shape has 3 sides?', options: ['Triangle', 'Square'], correct: 'Triangle', emoji: '🔺', explanation: 'A triangle has exactly 3 sides!' },
    { question: 'What shape has 4 equal sides?', options: ['Square', 'Rectangle'], correct: 'Square', emoji: '⬜', explanation: 'A square has 4 equal sides and 4 right angles!' },
    { question: 'What do we call a picture of a person?', options: ['Portrait', 'Landscape'], correct: 'Portrait', emoji: '👤', explanation: 'A portrait is a picture of a person!' },
    { question: 'What do we call a picture of nature?', options: ['Landscape', 'Portrait'], correct: 'Landscape', emoji: '🏞️', explanation: 'A landscape is a picture of nature like mountains, trees, or fields!' }
  ];

  const geographyQuestions = [
    { question: 'What is the biggest ocean?', options: ['Pacific Ocean', 'Atlantic Ocean'], correct: 'Pacific Ocean', emoji: '🌊', explanation: 'The Pacific Ocean is the largest ocean on Earth!' },
    { question: 'What is the biggest continent?', options: ['Asia', 'Africa'], correct: 'Asia', emoji: '🌏', explanation: 'Asia is the largest continent on Earth!' },
    { question: 'What is the coldest continent?', options: ['Antarctica', 'North America'], correct: 'Antarctica', emoji: '🧊', explanation: 'Antarctica is the coldest continent with lots of ice!' },
    { question: 'What is the hottest continent?', options: ['Africa', 'Australia'], correct: 'Africa', emoji: '🌍', explanation: 'Africa has the hottest deserts and climates!' },
    { question: 'What is the longest river?', options: ['Nile River', 'Amazon River'], correct: 'Nile River', emoji: '🌊', explanation: 'The Nile River in Africa is the longest river in the world!' },
    { question: 'What is the tallest mountain?', options: ['Mount Everest', 'Mount Kilimanjaro'], correct: 'Mount Everest', emoji: '🏔️', explanation: 'Mount Everest is the tallest mountain on Earth!' },
    { question: 'What is the biggest desert?', options: ['Sahara Desert', 'Gobi Desert'], correct: 'Sahara Desert', emoji: '🏜️', explanation: 'The Sahara Desert in Africa is the largest hot desert!' },
    { question: 'What country has the most people?', options: ['China', 'India'], correct: 'China', emoji: '🇨🇳', explanation: 'China has the most people of any country in the world!' }
  ];

  const historyQuestions = [
    { question: 'Who was the first president of the United States?', options: ['George Washington', 'Thomas Jefferson'], correct: 'George Washington', emoji: '👨‍💼', explanation: 'George Washington was the first president of the United States!' },
    { question: 'What year did Christopher Columbus sail to America?', options: ['1492', '1493'], correct: '1492', emoji: '⛵', explanation: 'Christopher Columbus sailed to America in 1492!' },
    { question: 'Who invented the light bulb?', options: ['Thomas Edison', 'Benjamin Franklin'], correct: 'Thomas Edison', emoji: '💡', explanation: 'Thomas Edison invented the light bulb!' },
    { question: 'What was the name of the ship that brought the Pilgrims to America?', options: ['Mayflower', 'Titanic'], correct: 'Mayflower', emoji: '🚢', explanation: 'The Mayflower brought the Pilgrims to America in 1620!' },
    { question: 'Who wrote the Declaration of Independence?', options: ['Thomas Jefferson', 'George Washington'], correct: 'Thomas Jefferson', emoji: '📜', explanation: 'Thomas Jefferson wrote the Declaration of Independence!' },
    { question: 'What war was fought between the North and South in America?', options: ['Civil War', 'Revolutionary War'], correct: 'Civil War', emoji: '⚔️', explanation: 'The Civil War was fought between the North and South!' },
    { question: 'Who was the first person to walk on the moon?', options: ['Neil Armstrong', 'Buzz Aldrin'], correct: 'Neil Armstrong', emoji: '🌙', explanation: 'Neil Armstrong was the first person to walk on the moon!' },
    { question: 'What year did World War II end?', options: ['1945', '1944'], correct: '1945', emoji: '✌️', explanation: 'World War II ended in 1945!' }
  ];

  const studyGuides = {
    phonics: { title: 'Phonics Guide', icon: '📚', sections: [{ heading: 'TH, WH, SH, CH, PH, CK Sounds', items: ['then, when, think, show, chair, phone, duck, ship, whip, thick'] }] },
    math: { title: 'Math Guide', icon: '🔢', sections: [{ heading: 'Place Value & Addition/Subtraction', items: ['Tens = groups of 10', '45 = 4 tens and 5 ones', 'Practice: 5+3=8, 12-4=8'] }] },
    reading: { title: 'Reading Guide', icon: '📖', sections: [{ heading: 'Story Elements', items: ['👥 Characters - WHO is in the story', '🏠 Setting - WHERE and WHEN', '😰 Problem - WHAT goes wrong', '✅ Solution - HOW it gets fixed'] }] },
    science: { title: 'Science Guide', icon: '🔬', sections: [{ heading: 'Systems, Plants, Animals, Weather', items: ['Systems have parts that work together', 'Plants need sunlight to grow', 'Animals need food to survive', 'Water freezes when cold'] }] },
    social: { title: 'Citizenship', icon: '🌟', sections: [{ heading: 'Good Citizenship', items: ['Be respectful and kind', 'Help others who need it', 'Keep community clean', 'Listen when others speak'] }] },
    art: { title: 'Art Guide', icon: '🎨', sections: [{ heading: 'Colors, Shapes, and Art', items: ['Primary colors: Red, Blue, Yellow', 'Mix red+blue=purple, yellow+blue=green', 'Triangle has 3 sides, square has 4', 'Portrait=person, landscape=nature'] }] },
    geography: { title: 'Geography Guide', icon: '🌍', sections: [{ heading: 'World Geography', items: ['Pacific Ocean is biggest', 'Asia is largest continent', 'Antarctica is coldest', 'Mount Everest is tallest mountain'] }] },
    history: { title: 'History Guide', icon: '📜', sections: [{ heading: 'Important History', items: ['George Washington was first president', 'Columbus sailed in 1492', 'Edison invented light bulb', 'Armstrong walked on moon'] }] }
  };

  // Achievement System
  const achievements = {
    first_steps: { id: 'first_steps', name: 'First Steps', description: 'Complete your first question!', icon: '👶', rarity: 'common', points: 10 },
    perfect_score: { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on any subject!', icon: '💯', rarity: 'rare', points: 50 },
    subject_master: { id: 'subject_master', name: 'Subject Master', description: 'Complete all questions in a subject!', icon: '🎓', rarity: 'epic', points: 100 },
    speed_demon: { id: 'speed_demon', name: 'Speed Demon', description: 'Answer 10 questions in under 2 minutes!', icon: '⚡', rarity: 'rare', points: 75 },
    scholar: { id: 'scholar', name: 'Scholar', description: 'Complete 5 different subjects!', icon: '📚', rarity: 'epic', points: 150 },
    perfectionist: { id: 'perfectionist', name: 'Perfectionist', description: 'Get perfect scores on 3 subjects!', icon: '⭐', rarity: 'legendary', points: 200 },
    marathon_runner: { id: 'marathon_runner', name: 'Marathon Runner', description: 'Answer 50 questions in one session!', icon: '🏃', rarity: 'rare', points: 100 },
    early_bird: { id: 'early_bird', name: 'Early Bird', description: 'Play before 8 AM!', icon: '🌅', rarity: 'common', points: 25 },
    night_owl: { id: 'night_owl', name: 'Night Owl', description: 'Play after 8 PM!', icon: '🦉', rarity: 'common', points: 25 },
    streak_master: { id: 'streak_master', name: 'Streak Master', description: 'Play for 7 days in a row!', icon: '🔥', rarity: 'epic', points: 200 },
    artist: { id: 'artist', name: 'Artist', description: 'Complete the spelling practice!', icon: '🎨', rarity: 'common', points: 30 },
    scientist: { id: 'scientist', name: 'Scientist', description: 'Master all science questions!', icon: '🔬', rarity: 'rare', points: 80 },
    mathematician: { id: 'mathematician', name: 'Mathematician', description: 'Master all math questions!', icon: '🧮', rarity: 'rare', points: 80 },
    reader: { id: 'reader', name: 'Reader', description: 'Master all reading questions!', icon: '📖', rarity: 'rare', points: 80 },
    citizen: { id: 'citizen', name: 'Good Citizen', description: 'Master all citizenship questions!', icon: '🌟', rarity: 'rare', points: 80 },
    counter: { id: 'counter', name: 'Counter', description: 'Master all skip counting!', icon: '🔢', rarity: 'rare', points: 80 },
    phonics_master: { id: 'phonics_master', name: 'Phonics Master', description: 'Master all phonics questions!', icon: '📚', rarity: 'rare', points: 80 },
    grand_master: { id: 'grand_master', name: 'Grand Master', description: 'Complete ALL subjects with perfect scores!', icon: '👑', rarity: 'legendary', points: 500 }
  };

  const themes = {
    default: { name: 'Default', colors: 'from-pink-200 via-purple-200 to-blue-200', unlocked: true },
    ocean: { name: 'Ocean', colors: 'from-blue-200 via-cyan-200 to-teal-200', unlocked: false, unlockRequirement: 'Complete 3 subjects' },
    forest: { name: 'Forest', colors: 'from-green-200 via-emerald-200 to-lime-200', unlocked: false, unlockRequirement: 'Get 5 perfect scores' },
    sunset: { name: 'Sunset', colors: 'from-orange-200 via-red-200 to-pink-200', unlocked: false, unlockRequirement: 'Play for 3 days in a row' },
    space: { name: 'Space', colors: 'from-purple-200 via-indigo-200 to-blue-200', unlocked: false, unlockRequirement: 'Answer 100 questions' },
    rainbow: { name: 'Rainbow', colors: 'from-pink-200 via-yellow-200 via-green-200 via-blue-200 to-purple-200', unlocked: false, unlockRequirement: 'Unlock all other themes' }
  };

  const avatars = {
    default: { name: 'Emmy', emoji: '👧', unlocked: true },
    robot: { name: 'Robo-Emmy', emoji: '🤖', unlocked: false, unlockRequirement: 'Complete 2 subjects' },
    princess: { name: 'Princess Emmy', emoji: '👸', unlocked: false, unlockRequirement: 'Get 3 perfect scores' },
    superhero: { name: 'Super Emmy', emoji: '🦸‍♀️', unlocked: false, unlockRequirement: 'Answer 50 questions' },
    astronaut: { name: 'Space Emmy', emoji: '👩‍🚀', unlocked: false, unlockRequirement: 'Complete all subjects' }
  };

  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === 'correct') {
        // Happy ascending chord
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          o.type = 'sine';
          g.gain.setValueAtTime(0.2, ctx.currentTime + i*0.05);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.05 + 0.4);
          o.start(ctx.currentTime + i*0.05); o.stop(ctx.currentTime + i*0.05 + 0.4);
        });
      } else if (type === 'incorrect') {
        // Sad descending tone
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
      } else if (type === 'click') {
        // Button click sound
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 800;
        o.type = 'square';
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1);
      } else if (type === 'complete') {
        // Victory fanfare
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          o.type = 'sine';
          g.gain.setValueAtTime(0.15, ctx.currentTime + i*0.1);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.1 + 0.5);
          o.start(ctx.currentTime + i*0.1); o.stop(ctx.currentTime + i*0.1 + 0.5);
        });
      }
    } catch (e) {
      // Silently fail if audio context is not available
    }
  };

  // Background music functions
  const playBackgroundMusic = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple, calming melody
      const melody = [
        { freq: 523, duration: 0.5 }, // C5
        { freq: 659, duration: 0.5 }, // E5
        { freq: 784, duration: 0.5 }, // G5
        { freq: 659, duration: 0.5 }, // E5
        { freq: 523, duration: 0.5 }, // C5
        { freq: 440, duration: 0.5 }, // A4
        { freq: 523, duration: 0.5 }, // C5
        { freq: 440, duration: 1.0 }  // A4
      ];
      
      let currentTime = ctx.currentTime;
      
      melody.forEach((note, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        currentTime += note.duration;
      });
      
      // Loop the melody
      setTimeout(() => {
        if (isMusicPlaying) {
          playBackgroundMusic();
        }
      }, currentTime * 1000);
      
    } catch (e) {
      // Silently fail if audio context is not available
    }
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      setIsMusicPlaying(false);
      if (backgroundMusic) {
        backgroundMusic.stop();
        setBackgroundMusic(null);
      }
    } else {
      setIsMusicPlaying(true);
      playBackgroundMusic();
    }
  };

  useEffect(() => {
    canvasRefs.forEach((ref) => {
      if (ref.current) {
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        
        // Set up high DPI canvas
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        // Set drawing properties
        ctx.strokeStyle = drawColor; 
        ctx.lineWidth = 3;
        ctx.lineCap = 'round'; 
        ctx.lineJoin = 'round';
      }
    });
  }, [currentScreen, drawColor]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startDrawing = (e, idx) => {
    const canvas = canvasRefs[idx].current;
    if (!canvas) return;
    e.preventDefault();
    triggerHaptic('light');
    setIsDrawing(true); setCurrentCanvas(idx);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = drawColor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e, idx) => {
    if (!isDrawing || currentCanvas !== idx) return;
    e.preventDefault();
    const canvas = canvasRefs[idx].current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = (idx) => {
    const canvas = canvasRefs[idx].current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAnswer = (sel, cor, qs, explanation) => {
    const ok = sel === cor;
    const newScore = score + (ok ? 10 : 0);
      setScore(newScore);
    
    // Update stats
    const updatedStats = {
      ...progress.stats,
      totalQuestionsAnswered: progress.stats.totalQuestionsAnswered + 1,
      correctAnswers: progress.stats.correctAnswers + (ok ? 1 : 0),
      timeSpent: progress.stats.timeSpent + 1 // Simple time tracking
    };
    
    if (ok) { 
      playSound('correct');
      triggerHaptic('success');
      setShowFeedback('correct'); 
      setAnswerAnimation('correct-bounce');
    } else { 
      playSound('incorrect');
      triggerHaptic('error');
      setShowFeedback('incorrect'); 
      setAnswerAnimation('incorrect-shake');
      setCorrectAnswer(cor);
      if (explanation) setTimeout(() => setShowExplanation(true), 800);
    }
    
    setTimeout(() => {
      setShowFeedback(null); 
      setAnswerAnimation(''); 
      setShowExplanation(false); 
      setCorrectAnswer('');
      
      if (currentQuestion < qs.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Mark subject as completed
        const subjectScore = Math.round((newScore / (qs.length * 10)) * 100);
        const isPerfectScore = subjectScore === 100;
        
        let newProgress = {
          ...progress,
          totalScore: progress.totalScore + newScore,
          lastPlayed: new Date().toISOString(),
          stats: updatedStats,
          completedSubjects: {
            ...progress.completedSubjects,
            [currentScreen]: {
              completed: true,
              score: subjectScore,
              completedAt: new Date().toISOString(),
              questionsAnswered: qs.length,
              correctAnswers: Math.floor(newScore / 10)
            }
          }
        };
        
        // Update perfect scores count
        if (isPerfectScore) {
          newProgress.stats.perfectScores = (newProgress.stats.perfectScores || 0) + 1;
        }
        
        // Check for achievements and unlocks
        newProgress = checkAchievements(newProgress);
        newProgress = checkUnlocks(newProgress);
        
        saveProgress(newProgress);
        playSound('complete');
        triggerHaptic('success');
        setCurrentScreen('complete');
      }
    }, explanation && !ok ? 3500 : 1500);
  };

  const resetGame = () => { setCurrentQuestion(0); setScore(0); setCurrentScreen('home'); };

  if (currentScreen === 'home') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const currentAvatar = avatars[progress.avatar] || avatars.default;
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        {/* Achievement Notification */}
        {showAchievement && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl animate-bounce">
              <div className="text-6xl mb-4">{showAchievement.icon}</div>
              <h3 className="text-2xl font-bold text-purple-800 mb-2">Achievement Unlocked!</h3>
              <h4 className="text-xl font-bold text-gray-800 mb-2">{showAchievement.name}</h4>
              <p className="text-gray-600 mb-4">{showAchievement.description}</p>
              <div className="text-lg font-bold text-yellow-600">+{showAchievement.points} points</div>
            </div>
          </div>
        )}
        
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-4 right-4 z-40 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-lg">📡</span>
            <span className="font-bold">Offline Mode</span>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl float">{currentAvatar.emoji}</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2 rainbow">✨ Emmy's First Grade Learning Adventure ✨</h1>
                <div className="text-lg text-purple-600 pulse">Welcome, {currentAvatar.name}!</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-purple-700">🏆 {progress.totalScore}</span>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">Streak: {progress.streak} days</div>
                <div className="text-sm text-purple-500">Completed: {Object.keys(progress.completedSubjects).length}/10 subjects</div>
                <div className="text-sm text-purple-500">Achievements: {progress.achievements.length}</div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <div onClick={() => { playSound('click'); triggerHaptic('medium'); setCurrentScreen('achievements'); }} 
                  className="px-4 py-2 bg-yellow-500 text-white rounded-full font-bold cursor-pointer hover:bg-yellow-600 active:scale-95 transition-transform">
                  🏅 Achievements
                </div>
                <div onClick={() => { playSound('click'); triggerHaptic('medium'); setCurrentScreen('customize'); }} 
                  className="px-4 py-2 bg-green-500 text-white rounded-full font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition-transform">
                  🎨 Customize
                </div>
                <div onClick={() => { playSound('click'); triggerHaptic('medium'); setCurrentScreen('progress'); }} 
                  className="px-4 py-2 bg-indigo-500 text-white rounded-full font-bold cursor-pointer hover:bg-indigo-600 active:scale-95 transition-transform">
                  📊 Progress
                </div>
                <div onClick={() => { playSound('click'); triggerHaptic('light'); toggleMusic(); }} 
                  className={`px-4 py-2 text-white rounded-full font-bold cursor-pointer hover:opacity-80 active:scale-95 transition-transform ${isMusicPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                  {isMusicPlaying ? '🔇 Music Off' : '🎵 Music On'}
              </div>
              {progress.totalScore > 0 && <div onClick={() => { playSound('click'); triggerHaptic('medium'); resetGame(); }} className="px-4 py-2 bg-red-500 text-white rounded-full font-bold cursor-pointer hover:bg-red-600 active:scale-95 transition-transform">Reset</div>}
              </div>
              
              {/* Difficulty Selector */}
              <div className="mt-6 bg-white rounded-2xl p-4 shadow-xl">
                <h3 className="text-lg font-bold text-purple-700 mb-3 text-center">🎯 Difficulty Level</h3>
                <div className="flex justify-center gap-2">
                  {['easy', 'medium', 'hard'].map(level => (
                    <div key={level} 
                      onClick={() => { playSound('click'); triggerHaptic('light'); setDifficulty(level); }}
                      className={`px-4 py-2 rounded-full font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                        difficulty === level 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}>
                      {level === 'easy' ? '😊 Easy' : level === 'medium' ? '😐 Medium' : '😤 Hard'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">📚 Study Guides</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.keys(studyGuides).map(type => (
                <div key={type} onClick={() => { playSound('click'); triggerHaptic('light'); setCurrentScreen(`guide-${type}`); }} 
                  className="bg-gradient-to-br from-pink-300 to-pink-500 p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                  <div className="text-3xl mb-1">{studyGuides[type].icon}</div>
                  <h3 className="text-xs md:text-sm font-bold text-white">{studyGuides[type].title}</h3>
                  {progress.completedSubjects[type] && <div className="text-xs text-yellow-200">✅ Complete</div>}
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">🎮 Games</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'phonics', title: 'Phonics', icon: '📚', color: 'from-pink-400 to-pink-600' },
              { name: 'math', title: 'Math', icon: '🔢', color: 'from-blue-400 to-blue-600' },
              { name: 'reading', title: 'Reading', icon: '📖', color: 'from-green-400 to-green-600' },
              { name: 'spelling', title: 'Spelling', icon: '✏️', color: 'from-purple-400 to-purple-600' },
              { name: 'science', title: 'Science', icon: '🔬', color: 'from-teal-400 to-teal-600' },
              { name: 'social', title: 'Citizenship', icon: '🌟', color: 'from-orange-400 to-orange-600' },
              { name: 'skipcounting', title: 'Skip Count', icon: '🔢', color: 'from-indigo-400 to-indigo-600' },
              { name: 'art', title: 'Art', icon: '🎨', color: 'from-pink-400 to-rose-600' },
              { name: 'geography', title: 'Geography', icon: '🌍', color: 'from-emerald-400 to-emerald-600' },
              { name: 'history', title: 'History', icon: '📜', color: 'from-amber-400 to-amber-600' }
            ].map(game => (
              <div key={game.name} onClick={() => { playSound('click'); triggerHaptic('medium'); setCurrentScreen(game.name); setCurrentQuestion(0); }}
                className={`bg-gradient-to-br ${game.color} p-6 rounded-3xl shadow-2xl hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform relative hover:wiggle`}>
                <div className="text-4xl md:text-5xl mb-2 sparkle">{game.icon}</div>
                <h2 className="text-lg md:text-xl font-bold text-white">{game.title}</h2>
                {progress.completedSubjects[game.name] && (
                  <div className="absolute top-2 right-2 text-2xl sparkle">🏆</div>
                )}
                {progress.completedSubjects[game.name] && (
                  <div className="text-sm text-yellow-200 mt-2">Score: {progress.completedSubjects[game.name].score}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen.startsWith('guide-')) {
    const type = currentScreen.replace('guide-', '');
    const guide = studyGuides[type];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 p-4 md:p-8">
        <div onClick={() => setCurrentScreen('home')} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl mb-4">{guide.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-800">{guide.title}</h1>
          </div>
          {guide.sections.map((sec, i) => (
            <div key={i} className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-4 border-purple-300">
              <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">{sec.heading}</h2>
              <ul className="space-y-2">
                {sec.items.map((item, j) => (
                  <li key={j} className="text-base md:text-lg text-gray-700 flex gap-2"><span className="text-purple-600 font-bold">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="text-center">
            <div onClick={() => { playSound('click'); setCurrentScreen(type); setCurrentQuestion(0); }} 
              className="inline-block px-8 md:px-12 py-4 md:py-6 text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:scale-110 cursor-pointer">
              Practice Now! 🎮
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'spelling') {
    const word = spellingWords[currentQuestion];
    const colors = [
      { name: 'Purple', value: '#8B5CF6' }, { name: 'Pink', value: '#EC4899' },
      { name: 'Blue', value: '#3B82F6' }, { name: 'Green', value: '#10B981' },
      { name: 'Red', value: '#EF4444' }, { name: 'Orange', value: '#F97316' }
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 to-purple-400 p-4 md:p-8">
        <div onClick={() => setCurrentScreen('home')} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12">
          <div className="text-center mb-6">
            <div className="text-4xl md:text-5xl mb-3">✏️</div>
            <p className="text-lg md:text-xl text-gray-600 mb-2">Word #{currentQuestion + 1} of {spellingWords.length}</p>
            <div className="text-4xl md:text-6xl font-bold text-purple-700 mb-4">{word.word}</div>
            <p className="text-lg md:text-xl text-gray-600 italic">Hint: {word.hint}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-center text-base md:text-lg font-bold text-purple-700 mb-3">🌈 Choose Rainbow Color!</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {colors.map(color => (
                <div key={color.value} onClick={() => { setDrawColor(color.value); triggerHaptic('light'); }}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform ${drawColor === color.value ? 'ring-4 ring-yellow-400' : ''}`}
                  style={{ backgroundColor: color.value }}
                  role="button"
                  aria-label={`Select ${color.name} color`}
                  tabIndex={0} />
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-pink-50 p-4 md:p-8 rounded-2xl border-4 border-purple-300">
            <p className="text-lg md:text-xl text-center text-purple-700 font-bold mb-4">✍️ Write 5 times!</p>
            <div className="space-y-3">
              {[0,1,2,3,4].map(i => (
                <div key={i}>
                  <div className="flex items-center mb-2">
                    <span className="text-xl font-bold text-purple-600 mr-3">{i+1}.</span>
                    <div onClick={() => { clearCanvas(i); triggerHaptic('light'); }} className="ml-auto px-3 py-1 bg-red-400 text-white rounded-full text-sm font-bold cursor-pointer hover:bg-red-500 active:scale-95 transition-transform">Clear</div>
                  </div>
                  <canvas ref={canvasRefs[i]} width={600} height={80}
                    onMouseDown={(e) => startDrawing(e, i)} onMouseMove={(e) => draw(e, i)} 
                    onMouseUp={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    onTouchStart={(e) => startDrawing(e, i)} onTouchMove={(e) => draw(e, i)} 
                    onTouchEnd={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    className="w-full border-4 border-dashed border-purple-300 rounded-xl bg-white cursor-crosshair touch-none select-none"
                    style={{touchAction: 'none'}}
                    role="img"
                    aria-label={`Drawing canvas ${i+1} for spelling practice`}
                    tabIndex={0} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-4">
            <div onClick={() => { if(currentQuestion>0) { setCurrentQuestion(currentQuestion-1); triggerHaptic('light'); } }} 
              className={`px-6 py-3 font-bold bg-gray-300 rounded-full cursor-pointer active:scale-95 transition-transform ${currentQuestion===0?'opacity-50':''}`}>← Prev</div>
            <div onClick={() => { if(currentQuestion<spellingWords.length-1) { setCurrentQuestion(currentQuestion+1); triggerHaptic('light'); } else { setCurrentScreen('home'); triggerHaptic('success'); } }} 
              className="px-6 py-3 font-bold bg-purple-500 text-white rounded-full cursor-pointer active:scale-95 transition-transform">
              {currentQuestion < spellingWords.length-1 ? 'Next →' : 'Done 🎉'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-200 to-orange-300 p-8 flex items-center justify-center">
        <div className="max-w-2xl bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="text-9xl mb-6">🏆</div>
          <h2 className="text-4xl md:text-5xl font-bold text-yellow-600 mb-4">Amazing Job!</h2>
          <p className="text-3xl md:text-4xl font-bold text-purple-600 mb-8">Score: {score} ⭐</p>
          <div onClick={() => { playSound('click'); resetGame(); }} className="inline-block px-12 py-6 text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:scale-110 cursor-pointer">Play Again! 🎮</div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'achievements') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const earnedAchievements = progress.achievements || [];
    const totalPoints = earnedAchievements.reduce((sum, id) => sum + (achievements[id]?.points || 0), 0);
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        <div onClick={() => setCurrentScreen('home')} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">🏅 Achievements</h1>
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-3xl font-bold text-purple-700 mb-2">Total Points: {totalPoints}</div>
              <div className="text-lg text-gray-600">Earned: {earnedAchievements.length} / {Object.keys(achievements).length}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(achievements).map(achievement => {
              const isEarned = earnedAchievements.includes(achievement.id);
              const rarityColors = {
                common: 'from-gray-300 to-gray-400',
                rare: 'from-blue-300 to-blue-400',
                epic: 'from-purple-300 to-purple-400',
                legendary: 'from-yellow-300 to-yellow-400'
              };
              
              return (
                <div key={achievement.id} className={`bg-gradient-to-br ${isEarned ? rarityColors[achievement.rarity] : 'from-gray-200 to-gray-300'} p-6 rounded-2xl shadow-lg ${isEarned ? '' : 'opacity-60'}`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="text-sm font-bold text-purple-700">+{achievement.points} points</div>
                    {isEarned && <div className="text-xs text-green-600 font-bold mt-1">✓ Earned!</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'customize') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const unlockedThemes = progress.unlockedThemes || ['default'];
    const unlockedAvatars = progress.unlockedAvatars || ['default'];
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        <div onClick={() => setCurrentScreen('home')} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">🎨 Customize</h1>
          </div>
          
          {/* Theme Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">🌈 Themes</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(themes).map(([id, theme]) => {
                const isUnlocked = unlockedThemes.includes(id);
                const isSelected = progress.selectedTheme === id;
                
                return (
                  <div key={id} 
                    onClick={() => {
                      if (isUnlocked) {
                        playSound('click');
                        triggerHaptic('light');
                        const newProgress = { ...progress, selectedTheme: id };
                        saveProgress(newProgress);
                      }
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-transform ${isUnlocked ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'} ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}>
                    <div className={`h-16 rounded-lg bg-gradient-to-br ${theme.colors} mb-2`}></div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{theme.name}</div>
                      {!isUnlocked && <div className="text-xs text-gray-500">{theme.unlockRequirement}</div>}
                      {isSelected && <div className="text-xs text-green-600 font-bold">Selected</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Avatar Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">👤 Avatars</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(avatars).map(([id, avatar]) => {
                const isUnlocked = unlockedAvatars.includes(id);
                const isSelected = progress.avatar === id;
                
                return (
                  <div key={id} 
                    onClick={() => {
                      if (isUnlocked) {
                        playSound('click');
                        triggerHaptic('light');
                        const newProgress = { ...progress, avatar: id };
                        saveProgress(newProgress);
                      }
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-transform ${isUnlocked ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'} ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{avatar.emoji}</div>
                      <div className="font-bold text-gray-800">{avatar.name}</div>
                      {!isUnlocked && <div className="text-xs text-gray-500">{avatar.unlockRequirement}</div>}
                      {isSelected && <div className="text-xs text-green-600 font-bold">Selected</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'progress') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const completedSubjects = Object.keys(progress.completedSubjects).length;
    const totalSubjects = 10;
    const accuracy = progress.stats.totalQuestionsAnswered > 0 
      ? Math.round((progress.stats.correctAnswers / progress.stats.totalQuestionsAnswered) * 100) 
      : 0;
    const averageScore = completedSubjects > 0 
      ? Math.round(Object.values(progress.completedSubjects).reduce((sum, sub) => sum + sub.score, 0) / completedSubjects)
      : 0;
    
    // Calculate favorite subject
    const subjectScores = Object.entries(progress.completedSubjects).map(([name, data]) => ({
      name,
      score: data.score,
      questions: data.questionsAnswered || 0
    }));
    const favoriteSubject = subjectScores.length > 0 
      ? subjectScores.reduce((best, current) => current.score > best.score ? current : best)
      : null;
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        <div onClick={() => setCurrentScreen('home')} className="no-print bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">📊 Learning Progress</h1>
            <p className="text-lg text-purple-600">Track Emmy's learning journey and achievements</p>
          </div>
          
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-purple-700 mb-2">{progress.totalScore}</div>
              <div className="text-gray-600">Total Points</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">{completedSubjects}/{totalSubjects}</div>
              <div className="text-gray-600">Subjects Completed</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">{accuracy}%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-orange-700 mb-2">{progress.achievements.length}</div>
              <div className="text-gray-600">Achievements</div>
            </div>
          </div>
          
          {/* Subject Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">📚 Subject Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'phonics', title: 'Phonics', icon: '📚' },
                { name: 'math', title: 'Math', icon: '🔢' },
                { name: 'reading', title: 'Reading', icon: '📖' },
                { name: 'spelling', title: 'Spelling', icon: '✏️' },
                { name: 'science', title: 'Science', icon: '🔬' },
                { name: 'social', title: 'Citizenship', icon: '🌟' },
                { name: 'skipcounting', title: 'Skip Count', icon: '🔢' },
                { name: 'art', title: 'Art', icon: '🎨' },
                { name: 'geography', title: 'Geography', icon: '🌍' },
                { name: 'history', title: 'History', icon: '📜' }
              ].map(subject => {
                const subjectData = progress.completedSubjects[subject.name];
                const isCompleted = subjectData && subjectData.completed;
                const score = subjectData ? subjectData.score : 0;
                
                return (
                  <div key={subject.name} className={`p-4 rounded-xl border-2 ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{subject.icon}</span>
                        <span className="font-bold text-gray-800">{subject.title}</span>
                      </div>
                      {isCompleted && <span className="text-green-600 font-bold">✓</span>}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                        style={{ width: `${isCompleted ? 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {isCompleted ? `Score: ${score}%` : 'Not started'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Learning Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-purple-700 mb-4">📈 Learning Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered:</span>
                  <span className="font-bold">{progress.stats.totalQuestionsAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answers:</span>
                  <span className="font-bold text-green-600">{progress.stats.correctAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Perfect Scores:</span>
                  <span className="font-bold text-yellow-600">{progress.stats.perfectScores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Score:</span>
                  <span className="font-bold text-blue-600">{averageScore}%</span>
                </div>
                {favoriteSubject && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Favorite Subject:</span>
                    <span className="font-bold text-purple-600">{favoriteSubject.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-purple-700 mb-4">🏆 Recent Achievements</h3>
              <div className="space-y-3">
                {progress.achievements.slice(-5).reverse().map(achievementId => {
                  const achievement = achievements[achievementId];
                  return achievement ? (
                    <div key={achievementId} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-bold text-gray-800">{achievement.name}</div>
                        <div className="text-sm text-gray-600">{achievement.description}</div>
                      </div>
                    </div>
                  ) : null;
                })}
                {progress.achievements.length === 0 && (
                  <div className="text-gray-500 text-center py-4">No achievements yet. Keep learning!</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Print Report Button */}
          <div className="text-center mt-8">
            <button 
              onClick={() => window.print()}
              className="px-8 py-4 bg-purple-500 text-white rounded-full font-bold text-lg hover:bg-purple-600 active:scale-95 transition-transform shadow-lg">
              🖨️ Print Progress Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionSets = {
    phonics: phonicsQuestions[difficulty] || phonicsQuestions.medium, 
    math: mathQuestions[difficulty] || mathQuestions.medium, 
    reading: readingQuestions, science: scienceQuestions, social: socialStudiesQuestions, 
    skipcounting: skipCountingQuestions, art: artQuestions, geography: geographyQuestions, 
    history: historyQuestions
  };
  const qs = questionSets[currentScreen] || [];
  const q = qs[currentQuestion] || {};
  const bgColors = {
    phonics: 'from-pink-200 to-pink-400', math: 'from-blue-200 to-blue-400',
    reading: 'from-green-200 to-green-400', science: 'from-teal-200 to-teal-400',
    social: 'from-orange-200 to-orange-400', skipcounting: 'from-indigo-200 to-indigo-400',
    art: 'from-rose-200 to-rose-400', geography: 'from-emerald-200 to-emerald-400', 
    history: 'from-amber-200 to-amber-400'
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColors[currentScreen]} p-4 md:p-8`}>
      <div className="flex justify-between mb-4 gap-2">
        <div onClick={() => setCurrentScreen('home')} className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg hover:scale-105 cursor-pointer">← Back</div>
        <div onClick={() => setCurrentQuestion(0)} className="bg-orange-500 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg text-white font-bold hover:scale-105 cursor-pointer">🔄 Restart</div>
      </div>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12 relative">
        {showFeedback && (
          <div className={`absolute inset-0 flex items-center justify-center z-50 rounded-3xl ${showFeedback==='correct'?'bg-green-500':'bg-red-500'} bg-opacity-90`}>
            <div className="text-center p-4">
              <div className="text-7xl md:text-9xl mb-4">{showFeedback==='correct'?'🎉':'😅'}</div>
              <p className="text-3xl md:text-5xl font-bold text-white mb-2">{showFeedback==='correct'?'Amazing!':'Try Again!'}</p>
              {showExplanation && correctAnswer && (
                <div className="mt-4 bg-white bg-opacity-20 rounded-2xl p-4">
                  <p className="text-xl md:text-2xl font-bold text-white mb-2">Correct answer: {correctAnswer}</p>
                  {q.explanation && <p className="text-lg md:text-xl text-white">{q.explanation}</p>}
                </div>
              )}
            </div>
          </div>
        )}
        <div className={`text-center mb-8 ${answerAnimation}`}>
          <div className="text-6xl md:text-8xl mb-4">{q.image || q.emoji}</div>
          {q.word && <div className="text-4xl md:text-6xl font-bold text-pink-600 mb-4">{q.word}</div>}
          <p className="text-2xl md:text-3xl font-bold text-gray-700 mb-8">{q.question}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {(q.options || []).map((opt, i) => (
            <div key={i} onClick={() => { triggerHaptic('medium'); handleAnswer(opt, q.correct || q.answer, qs, q.explanation); }} 
              className="p-6 md:p-8 text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:scale-110 active:scale-105 cursor-pointer bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 transition-transform"
              role="button"
              aria-label={`Answer option: ${opt}`}
              tabIndex={0}>
              {opt}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-xl md:text-2xl text-gray-600">Question {currentQuestion+1} of {qs.length}</p>
          <p className="text-2xl md:text-3xl font-bold mt-2">Score: {score} ⭐</p>
        </div>
      </div>
      <style>{`
        .correct-bounce { animation: bounce 0.6s; }
        .incorrect-shake { animation: shake 0.5s; }
        .float { animation: float 3s ease-in-out infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .wiggle { animation: wiggle 0.5s ease-in-out; }
        .sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .rainbow { animation: rainbow 2s linear infinite; }
        
        @keyframes bounce { 
          0%,100% { transform: translateY(0); } 
          50% { transform: translateY(-20px); } 
        }
        @keyframes shake { 
          0%,100% { transform: translateX(0); } 
          25% { transform: translateX(-10px); } 
          75% { transform: translateX(10px); } 
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        
        .particle {
          position: absolute;
          pointer-events: none;
          animation: particle-float 2s ease-out forwards;
        }
        
        @keyframes particle-float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
        
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .bg-gradient-to-br { background: white !important; }
          .shadow-xl, .shadow-lg { box-shadow: none !important; }
          .text-purple-800, .text-purple-700, .text-purple-600 { color: #000 !important; }
          .text-gray-600, .text-gray-500 { color: #333 !important; }
          .bg-white { background: white !important; border: 1px solid #ccc !important; }
          .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 4px !important; }
          .grid { display: block !important; }
          .grid > div { margin-bottom: 20px; }
        }
      `}</style>
    </div>
  );
};

export default EmmyStudyGame;

