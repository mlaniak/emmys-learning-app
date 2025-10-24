import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Week10Newsletter from './Week10Newsletter';
import Week9Newsletter from './Week9Newsletter';
import Week8Newsletter from './Week8Newsletter';
import NewsletterSelector from './NewsletterSelector';

const EmmyStudyGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [parentQuizMode, setParentQuizMode] = useState(false);
  const [parentQuizWord, setParentQuizWord] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('phonics');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState(['Home']);
  const [learningStreak, setLearningStreak] = useState(0);
  const [lastLearningDate, setLastLearningDate] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [parentMode, setParentMode] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [customQuestionCount, setCustomQuestionCount] = useState('');
  const [pendingGame, setPendingGame] = useState(null);
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

  // Share results functionality
  const shareResults = (subject, score, questionsAnswered, correctAnswers) => {
    const subjectNames = {
      'phonics': 'Phonics',
      'math': 'Math',
      'reading': 'Reading',
      'spelling': 'Spelling',
      'science': 'Science',
      'social': 'Social Studies',
      'skipcounting': 'Skip Counting',
      'art': 'Art',
      'geography': 'Geography',
      'history': 'History'
    };

    const subjectName = subjectNames[subject] || subject;
    const percentage = Math.round((score / (questionsAnswered * 10)) * 100);
    const completionTime = new Date().toLocaleString();
    
    const shareData = {
      subject: subjectName,
      score: score,
      percentage: percentage,
      questionsAnswered: questionsAnswered,
      correctAnswers: correctAnswers,
      completedAt: completionTime,
      message: shareMessage || `I just completed ${subjectName} with a score of ${percentage}%! 🎉`
    };

    return shareData;
  };

  const handleEmailShare = () => {
    const subjectName = {
      'phonics': 'Phonics',
      'math': 'Math',
      'reading': 'Reading',
      'spelling': 'Spelling',
      'science': 'Science',
      'social': 'Social Studies',
      'skipcounting': 'Skip Counting',
      'art': 'Art',
      'geography': 'Geography',
      'history': 'History'
    }[currentScreen] || currentScreen;

    const percentage = Math.round((score / (currentQuestion * 10)) * 100);
    const completionTime = new Date().toLocaleString();
    
    const emailSubject = `🎉 ${subjectName} Completion - Great Job!`;
    const emailBody = `
Hi! 

I just completed the ${subjectName} module in Emmy's Learning Adventure! 

📊 My Results:
• Subject: ${subjectName}
• Score: ${score} points
• Percentage: ${percentage}%
• Questions Answered: ${currentQuestion}
• Correct Answers: ${Math.floor(score / 10)}
• Completed: ${completionTime}

${shareMessage || "I'm so proud of my progress! 🎉"}

Keep encouraging my learning journey! 

Love,
Your Student 🌟
    `.trim();

    const mailtoLink = `mailto:${shareEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
    setShowShareModal(false);
    setShareEmail('');
    setShareMessage('');
  };

  // Breadcrumb navigation helper
  const updateBreadcrumbs = (newScreen, additionalInfo = '') => {
    const breadcrumbMap = {
      'home': ['Home'],
      'parent-reference': ['Home', 'Parent Reference'],
      'achievements': ['Home', 'Achievements'],
      'customize': ['Home', 'Customize'],
      'progress': ['Home', 'Progress'],
      'feedback': ['Home', 'Feedback'],
      'phonics': ['Home', 'Study Guides', 'Phonics'],
      'math': ['Home', 'Study Guides', 'Math'],
      'reading': ['Home', 'Study Guides', 'Reading'],
      'spelling': ['Home', 'Study Guides', 'Spelling'],
      'science': ['Home', 'Study Guides', 'Science'],
      'social': ['Home', 'Study Guides', 'Citizenship'],
      'skipcounting': ['Home', 'Study Guides', 'Skip Counting'],
      'art': ['Home', 'Study Guides', 'Art'],
      'geography': ['Home', 'Study Guides', 'Geography'],
      'history': ['Home', 'Study Guides', 'History']
    };
    
    let newBreadcrumbs = breadcrumbMap[newScreen] || ['Home'];
    if (additionalInfo) {
      newBreadcrumbs.push(additionalInfo);
    }
    setBreadcrumbs(newBreadcrumbs);
  };

  // Initialize breadcrumbs on component mount
  useEffect(() => {
    updateBreadcrumbs(currentScreen);
  }, []);

  // Search functionality
  const searchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const results = [];
    const query = searchQuery.toLowerCase();
    
    // Search in parent reference words
    Object.entries(parentReference).forEach(([subjectKey, subject]) => {
      subject.categories.forEach(category => {
        category.words.forEach(wordItem => {
          const word = typeof wordItem === 'string' ? wordItem : wordItem.word;
          if (word.toLowerCase().includes(query)) {
            results.push({
              type: 'word',
              subject: subject.title,
              category: category.name,
              word: word,
              example: typeof wordItem === 'object' ? wordItem.example : null,
              usage: typeof wordItem === 'object' ? wordItem.usage : null
            });
          }
        });
      });
    });
    
    // Search in study guides
    Object.entries(studyGuides).forEach(([key, guide]) => {
      if (guide.title.toLowerCase().includes(query)) {
        results.push({
          type: 'subject',
          subject: guide.title,
          icon: guide.icon,
          screen: key
        });
      }
    });
    
    return results.slice(0, 10); // Limit to 10 results
  };

  // URL synchronization effect
  useEffect(() => {
    // Handle hash-based redirects from 404.html
    if (window.location.hash && window.location.hash.startsWith('#')) {
      const hashPath = window.location.hash.substring(1);
      const pathParts = hashPath.split('/').filter(part => part);
      
      // Update the URL to the correct path without hash
      window.history.replaceState(null, '', `/emmys-learning-app${hashPath}`);
      
      // Process the path
      if (hashPath === '/' || hashPath === '') {
        setCurrentScreen('home');
      } else if (pathParts[0] === 'newsletter') {
        setCurrentScreen('newsletter');
        if (pathParts[1]) {
          setSelectedNewsletter(parseInt(pathParts[1]));
        } else {
          setSelectedNewsletter(null);
        }
      } else if (pathParts[0] === 'parent-reference') {
        setCurrentScreen('parent-reference');
        if (pathParts[1]) {
          setSelectedSubject(pathParts[1]);
          if (pathParts[2]) {
            setSelectedCategory(parseInt(pathParts[2]));
          } else {
            setSelectedCategory(0);
          }
        } else {
          setSelectedSubject('phonics');
          setSelectedCategory(0);
        }
      } else if (pathParts[0] === 'spelling') {
        setCurrentScreen('spelling');
      } else if (pathParts[0] === 'achievements') {
        setCurrentScreen('achievements');
      } else if (pathParts[0] === 'progress') {
        setCurrentScreen('progress');
      } else if (pathParts[0] === 'customize') {
        setCurrentScreen('customize');
      } else if (pathParts[0] === 'feedback') {
        setCurrentScreen('feedback');
      }
      return;
    }
    
    const path = location.pathname.replace('/emmys-learning-app', '');
    const pathParts = path.split('/').filter(part => part);
    
    if (path === '/' || path === '') {
      setCurrentScreen('home');
    } else if (pathParts[0] === 'newsletter') {
      setCurrentScreen('newsletter');
      if (pathParts[1]) {
        setSelectedNewsletter(parseInt(pathParts[1]));
      } else {
        setSelectedNewsletter(null);
      }
    } else if (pathParts[0] === 'parent-reference') {
      setCurrentScreen('parent-reference');
      if (pathParts[1]) {
        setSelectedSubject(pathParts[1]);
        if (pathParts[2]) {
          setSelectedCategory(parseInt(pathParts[2]));
        } else {
          setSelectedCategory(0);
        }
      } else {
        setSelectedSubject('phonics');
        setSelectedCategory(0);
      }
    } else if (pathParts[0] === 'spelling') {
      setCurrentScreen('spelling');
      // Handle spelling modes if needed
    } else if (pathParts[0] === 'achievements') {
      setCurrentScreen('achievements');
      // Handle achievement categories if needed
    } else if (pathParts[0] === 'progress') {
      setCurrentScreen('progress');
      // Handle progress sections if needed
    } else if (pathParts[0] === 'customize') {
      setCurrentScreen('customize');
      // Handle customize sections if needed
    } else if (pathParts[0] === 'feedback') {
      setCurrentScreen('feedback');
      // Handle feedback categories if needed
    }
  }, [location.pathname]);

  // Navigation helper with breadcrumb updates and URL updates
  const navigateTo = (screen, additionalInfo = '', params = {}) => {
    playSound('click');
    triggerHaptic('light');
    setCurrentScreen(screen);
    updateBreadcrumbs(screen, additionalInfo);
    setShowSearch(false);
    setSearchQuery('');
    
    // Update URL based on screen and parameters
    if (screen === 'home') {
      navigate('/');
    } else if (screen === 'newsletter') {
      if (params.week) {
        navigate(`/newsletter/${params.week}`);
        setSelectedNewsletter(parseInt(params.week));
      } else {
        navigate('/newsletter');
        setSelectedNewsletter(null);
      }
    } else if (screen.startsWith('newsletter-')) {
      const week = screen.replace('newsletter-', '');
      navigate(`/newsletter/${week}`);
      setSelectedNewsletter(parseInt(week));
    } else if (screen === 'parent-reference') {
      if (params.subject) {
        if (params.category !== undefined) {
          navigate(`/parent-reference/${params.subject}/${params.category}`);
          setSelectedSubject(params.subject);
          setSelectedCategory(parseInt(params.category));
        } else {
          navigate(`/parent-reference/${params.subject}`);
          setSelectedSubject(params.subject);
          setSelectedCategory(0);
        }
      } else {
        navigate('/parent-reference');
        setSelectedSubject('phonics');
        setSelectedCategory(0);
      }
    } else {
      navigate(`/${screen}`);
    }
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adaptive Learning System
  const calculateAdaptiveDifficulty = (subject, performance) => {
    const currentDifficulty = adaptiveDifficulty[subject] || 'medium';
    const recentScores = performance.slice(-5); // Last 5 attempts
    const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    if (averageScore >= 90 && recentScores.length >= 3) {
      return 'hard';
    } else if (averageScore <= 60 && recentScores.length >= 3) {
      return 'easy';
    }
    return currentDifficulty;
  };

  const updateConfidenceLevel = (subject, isCorrect, responseTime) => {
    const currentConfidence = confidenceLevels[subject] || 0.5;
    let newConfidence = currentConfidence;
    
    if (isCorrect) {
      newConfidence += 0.1;
    } else {
      newConfidence -= 0.15;
    }
    
    // Adjust based on response time (faster = more confident)
    if (responseTime < 3000) { // Less than 3 seconds
      newConfidence += 0.05;
    } else if (responseTime > 10000) { // More than 10 seconds
      newConfidence -= 0.05;
    }
    
    newConfidence = Math.max(0, Math.min(1, newConfidence)); // Clamp between 0 and 1
    
    setConfidenceLevels(prev => ({
      ...prev,
      [subject]: newConfidence
    }));
    
    return newConfidence;
  };

  // Daily Challenge System
  const generateDailyChallenge = () => {
    const today = new Date().toDateString();
    const savedChallenge = localStorage.getItem(`daily-challenge-${today}`);
    
    if (savedChallenge) {
      return JSON.parse(savedChallenge);
    }
    
    const challenges = [
      {
        id: 'perfect-score',
        title: 'Perfect Score Mission',
        description: 'Get 100% on any subject',
        reward: 50,
        icon: '⭐',
        type: 'perfect_score'
      },
      {
        id: 'streak-master',
        title: 'Streak Master',
        description: 'Complete 3 subjects in a row',
        reward: 75,
        icon: '🔥',
        type: 'streak'
      },
      {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Answer 10 questions in under 5 minutes',
        reward: 60,
        icon: '⚡',
        type: 'speed'
      },
      {
        id: 'explorer',
        title: 'Subject Explorer',
        description: 'Try 5 different subjects today',
        reward: 40,
        icon: '🗺️',
        type: 'exploration'
      },
      {
        id: 'confidence-builder',
        title: 'Confidence Builder',
        description: 'Improve confidence in your weakest subject',
        reward: 55,
        icon: '💪',
        type: 'confidence'
      }
    ];
    
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    localStorage.setItem(`daily-challenge-${today}`, JSON.stringify(randomChallenge));
    return randomChallenge;
  };

  // Learning Streak System
  const updateLearningStreak = () => {
    const today = new Date().toDateString();
    const lastDate = lastLearningDate;
    
    if (lastDate === today) {
      return; // Already counted today
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (lastDate === yesterdayString) {
      setLearningStreak(prev => prev + 1);
    } else if (lastDate !== today) {
      setLearningStreak(1); // Reset streak
    }
    
    setLastLearningDate(today);
  };

  // Feedback System
  const submitFeedback = () => {
    if (!feedbackMessage.trim()) return;
    
    const newFeedback = {
      id: Date.now(),
      category: feedbackCategory,
      message: feedbackMessage.trim(),
      rating: feedbackRating,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentScreen: currentScreen,
      progress: {
        totalScore: progress.totalScore,
        completedSubjects: Object.keys(progress.completedSubjects).length,
        learningStreak: learningStreak
      }
    };
    
    const updatedFeedback = [...feedback, newFeedback];
    setFeedback(updatedFeedback);
    localStorage.setItem('emmy-feedback', JSON.stringify(updatedFeedback));
    
    // Reset form
    setFeedbackMessage('');
    setFeedbackRating(5);
    setFeedbackCategory('general');
    setShowFeedbackModal(false);
    
    // Show success message
    playSound('correct');
    triggerHaptic('success');
    setShowFeedback('Thank you for your feedback! We appreciate your input.');
    setTimeout(() => setShowFeedback(null), 3000);
  };

  const getFeedbackStats = () => {
    const total = feedback.length;
    const avgRating = total > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    const categories = feedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});
    
    return { total, avgRating, categories };
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
      { question: 'What is 1 + 1?', options: ['2', '3'], correct: '2', emoji: '➕' },
      { question: 'What is 3 + 2?', options: ['4', '5'], correct: '5', emoji: '➕' },
      { question: 'What is 6 - 1?', options: ['4', '5'], correct: '5', emoji: '➖' },
      { question: 'How many toes on two feet?', options: ['8', '10'], correct: '10', emoji: '🦶' },
      { question: 'What is 4 + 1?', options: ['4', '5'], correct: '5', emoji: '➕' },
      { question: 'What is 8 - 3?', options: ['4', '5'], correct: '5', emoji: '➖' },
      { question: 'Which is smaller: 2 or 4?', options: ['2', '4'], correct: '2', emoji: '🔢' },
      { question: 'How many wheels on a bicycle?', options: ['2', '3'], correct: '2', emoji: '🚲' },
      { question: 'What is 0 + 5?', options: ['4', '5'], correct: '5', emoji: '➕' },
      { question: 'What is 9 - 4?', options: ['4', '5'], correct: '5', emoji: '➖' },
      { question: 'How many sides does a triangle have?', options: ['3', '4'], correct: '3', emoji: '🔺' },
      { question: 'What is 2 + 2?', options: ['3', '4'], correct: '4', emoji: '➕' },
      { question: 'What is 5 - 0?', options: ['4', '5'], correct: '5', emoji: '➖' },
      { question: 'Which is bigger: 1 or 0?', options: ['1', '0'], correct: '1', emoji: '🔢' },
      { question: 'How many legs does a cat have?', options: ['3', '4'], correct: '4', emoji: '🐱' },
      { question: 'What is 3 + 3?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'Sarah has 3 apples. She buys 2 more. How many apples does she have?', options: ['4', '5'], correct: '5', emoji: '🍎' },
      { question: 'Tom has 5 cookies. He eats 2. How many cookies are left?', options: ['2', '3'], correct: '3', emoji: '🍪' },
      { question: 'There are 4 birds on a tree. 1 more bird comes. How many birds are there?', options: ['4', '5'], correct: '5', emoji: '🐦' },
      { question: 'Emma has 6 stickers. She gives away 1. How many stickers does she have left?', options: ['4', '5'], correct: '5', emoji: '⭐' },
      { question: 'How many sides does a square have?', options: ['3', '4'], correct: '4', emoji: '⬜' },
      { question: 'How many corners does a triangle have?', options: ['3', '4'], correct: '3', emoji: '🔺' },
      { question: 'Which shape has 4 equal sides?', options: ['Triangle', 'Square'], correct: 'Square', emoji: '⬜' }
    ],
    medium: [
    { question: 'Which number is GREATER?', options: ['47', '52'], correct: '52', emoji: '🔢' },
    { question: 'How many tens in 45?', options: ['4', '5'], correct: '4', emoji: '🎯' },
    { question: 'What is 5 + 3?', options: ['7', '8'], correct: '8', emoji: '➕' },
    { question: 'What is 12 - 4?', options: ['7', '8'], correct: '8', emoji: '➖' },
    { question: 'How many ones in 23?', options: ['2', '3'], correct: '3', emoji: '🎯' },
    { question: 'What is 6 + 7?', options: ['12', '13'], correct: '13', emoji: '➕' },
    { question: 'What is 15 - 8?', options: ['6', '7'], correct: '7', emoji: '➖' },
    { question: 'What is 8 + 9?', options: ['16', '17'], correct: '17', emoji: '➕' },
    { question: 'What is 20 - 7?', options: ['12', '13'], correct: '13', emoji: '➖' },
    { question: 'How many tens in 67?', options: ['6', '7'], correct: '6', emoji: '🎯' },
    { question: 'Which is smaller: 34 or 28?', options: ['34', '28'], correct: '28', emoji: '🔢' },
    { question: 'What is 11 + 6?', options: ['16', '17'], correct: '17', emoji: '➕' },
    { question: 'What is 18 - 5?', options: ['12', '13'], correct: '13', emoji: '➖' },
    { question: 'How many ones in 89?', options: ['8', '9'], correct: '9', emoji: '🎯' },
    { question: 'Which is greater: 56 or 65?', options: ['56', '65'], correct: '65', emoji: '🔢' },
    { question: 'What is 7 + 8?', options: ['14', '15'], correct: '15', emoji: '➕' },
    { question: 'What is 16 - 9?', options: ['6', '7'], correct: '7', emoji: '➖' },
    { question: 'How many tens in 92?', options: ['9', '2'], correct: '9', emoji: '🎯' },
    { question: 'Which is smaller: 41 or 14?', options: ['41', '14'], correct: '14', emoji: '🔢' },
    { question: 'What is 9 + 6?', options: ['14', '15'], correct: '15', emoji: '➕' },
    { question: 'What is 19 - 4?', options: ['14', '15'], correct: '15', emoji: '➖' },
    { question: 'How many ones in 75?', options: ['7', '5'], correct: '5', emoji: '🎯' },
    { question: 'Which is greater: 38 or 83?', options: ['38', '83'], correct: '83', emoji: '🔢' },
    { question: 'What is 4 + 9?', options: ['12', '13'], correct: '13', emoji: '➕' },
    { question: 'What is 17 - 8?', options: ['8', '9'], correct: '9', emoji: '➖' },
    { question: 'How many tens in 51?', options: ['5', '1'], correct: '5', emoji: '🎯' },
    { question: 'Which is smaller: 72 or 27?', options: ['72', '27'], correct: '27', emoji: '🔢' },
    { question: 'What is 6 + 9?', options: ['14', '15'], correct: '15', emoji: '➕' },
      { question: 'What is 14 - 6?', options: ['7', '8'], correct: '8', emoji: '➖' },
      { question: 'How many ones in 63?', options: ['6', '3'], correct: '3', emoji: '🎯' },
      { question: 'Jake has 15 marbles. He loses 7. How many marbles does he have left?', options: ['7', '8'], correct: '8', emoji: '🔴' },
      { question: 'Lisa has 12 stickers. She gets 5 more. How many stickers does she have?', options: ['16', '17'], correct: '17', emoji: '⭐' },
      { question: 'There are 18 students in class. 9 are boys. How many are girls?', options: ['8', '9'], correct: '9', emoji: '👧' },
      { question: 'Mike has 20 toy cars. He gives 6 to his friend. How many cars does he have left?', options: ['13', '14'], correct: '14', emoji: '🚗' },
      { question: 'Anna has 16 crayons. She breaks 3. How many crayons are still good?', options: ['12', '13'], correct: '13', emoji: '🖍️' },
      { question: 'There are 14 books on the shelf. 7 more books are added. How many books are there?', options: ['20', '21'], correct: '21', emoji: '📚' },
      { question: 'How many sides does a rectangle have?', options: ['3', '4'], correct: '4', emoji: '📐' },
      { question: 'Which shape has 3 sides?', options: ['Square', 'Triangle'], correct: 'Triangle', emoji: '🔺' },
      { question: 'How many corners does a square have?', options: ['3', '4'], correct: '4', emoji: '⬜' },
      { question: 'Which shape has no corners?', options: ['Circle', 'Triangle'], correct: 'Circle', emoji: '⭕' }
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
      { question: 'What is 50 - 23?', options: ['26', '27'], correct: '27', emoji: '➖' },
      { question: 'Which is greater: 156 or 165?', options: ['156', '165'], correct: '165', emoji: '🔢' },
      { question: 'What is 35 + 28?', options: ['62', '63'], correct: '63', emoji: '➕' },
      { question: 'What is 72 - 45?', options: ['26', '27'], correct: '27', emoji: '➖' },
      { question: 'How many hundreds in 234?', options: ['2', '3'], correct: '2', emoji: '🎯' },
      { question: 'Which is smaller: 189 or 198?', options: ['189', '198'], correct: '189', emoji: '🔢' },
      { question: 'What is 47 + 36?', options: ['82', '83'], correct: '83', emoji: '➕' },
      { question: 'What is 85 - 29?', options: ['55', '56'], correct: '56', emoji: '➖' },
      { question: 'How many tens in 156?', options: ['5', '15'], correct: '15', emoji: '🎯' },
      { question: 'Which is greater: 234 or 243?', options: ['234', '243'], correct: '243', emoji: '🔢' },
      { question: 'What is 58 + 47?', options: ['104', '105'], correct: '105', emoji: '➕' },
      { question: 'What is 96 - 38?', options: ['57', '58'], correct: '58', emoji: '➖' },
      { question: 'How many ones in 789?', options: ['7', '9'], correct: '9', emoji: '🎯' },
      { question: 'Which is smaller: 345 or 354?', options: ['345', '354'], correct: '345', emoji: '🔢' },
      { question: 'What is 67 + 58?', options: ['124', '125'], correct: '125', emoji: '➕' },
      { question: 'What is 123 - 67?', options: ['55', '56'], correct: '56', emoji: '➖' },
      { question: 'How many hundreds in 567?', options: ['5', '6'], correct: '5', emoji: '🎯' },
      { question: 'Which is greater: 456 or 465?', options: ['456', '465'], correct: '465', emoji: '🔢' },
      { question: 'What is 78 + 69?', options: ['146', '147'], correct: '147', emoji: '➕' },
      { question: 'What is 145 - 78?', options: ['66', '67'], correct: '67', emoji: '➖' },
      { question: 'How many tens in 234?', options: ['3', '23'], correct: '23', emoji: '🎯' },
      { question: 'A store has 156 apples. They sell 78 apples. How many apples are left?', options: ['77', '78'], correct: '78', emoji: '🍎' },
      { question: 'Sarah has 234 stickers. She gives 67 to her friends. How many stickers does she have left?', options: ['166', '167'], correct: '167', emoji: '⭐' },
      { question: 'There are 345 students in the school. 123 are in first grade. How many are in other grades?', options: ['221', '222'], correct: '222', emoji: '👦' },
      { question: 'Tom has 456 toy cars. He buys 89 more. How many toy cars does he have?', options: ['544', '545'], correct: '545', emoji: '🚗' },
      { question: 'A library has 567 books. 234 books are checked out. How many books are still available?', options: ['332', '333'], correct: '333', emoji: '📚' },
      { question: 'Emma has 678 stickers. She uses 345 for her project. How many stickers does she have left?', options: ['332', '333'], correct: '333', emoji: '⭐' },
      { question: 'How many sides does a hexagon have?', options: ['5', '6'], correct: '6', emoji: '⬡' },
      { question: 'Which shape has 5 sides?', options: ['Pentagon', 'Hexagon'], correct: 'Pentagon', emoji: '⬟' },
      { question: 'How many corners does a pentagon have?', options: ['4', '5'], correct: '5', emoji: '⬟' },
      { question: 'Which shape has 8 sides?', options: ['Hexagon', 'Octagon'], correct: 'Octagon', emoji: '⏸️' },
      { question: 'How many sides does a cube have?', options: ['5', '6'], correct: '6', emoji: '🧊' }
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

  // Parent Quick Reference - Comprehensive Word Lists
  const parentReference = {
    phonics: {
      title: 'Phonics Word Lists',
      icon: '📚',
      categories: [
        {
          name: 'TH Words',
          words: ['then', 'than', 'think', 'that', 'this', 'with', 'bath', 'math', 'path', 'both', 'month', 'north', 'south', 'earth', 'birth']
        },
        {
          name: 'WH Words', 
          words: ['when', 'where', 'what', 'which', 'who', 'why', 'whip', 'whale', 'wheel', 'white', 'whisper', 'whistle', 'wheat', 'whisk', 'whiskers']
        },
        {
          name: 'SH Words',
          words: ['show', 'ship', 'shop', 'she', 'shoe', 'fish', 'wish', 'wash', 'brush', 'crash', 'flash', 'splash', 'squash', 'smash', 'trash']
        },
        {
          name: 'CH Words',
          words: ['chair', 'cheese', 'chicken', 'child', 'chin', 'chip', 'chop', 'church', 'lunch', 'march', 'much', 'such', 'teach', 'reach', 'catch']
        },
        {
          name: 'PH Words',
          words: ['phone', 'photo', 'elephant', 'alphabet', 'graph', 'paragraph', 'dolphin', 'trophy', 'sophomore', 'pharmacy', 'phrase', 'phase', 'physics', 'phantom', 'phoenix']
        },
        {
          name: 'CK Words',
          words: ['duck', 'back', 'pack', 'sack', 'tack', 'black', 'clock', 'block', 'rock', 'sock', 'lock', 'shock', 'stock', 'truck', 'stuck']
        }
      ]
    },
    spelling: {
      title: 'Spelling Word Lists',
      icon: '✏️',
      categories: [
        {
          name: 'October Words (Test 10/31)',
          words: [
            { word: 'than', example: 'I am taller than my sister.', usage: 'Used to compare two things' },
            { word: 'think', example: 'I think it will rain today.', usage: 'To use your mind to consider something' },
            { word: 'their', example: 'The children played with their toys.', usage: 'Shows something belongs to them' },
            { word: 'these', example: 'These cookies are delicious!', usage: 'Points to things close by (plural)' },
            { word: 'when', example: 'When will we go to the park?', usage: 'Asks about time' },
            { word: 'each', example: 'Each student gets a pencil.', usage: 'Every single one' },
            { word: 'such', example: 'She is such a good friend.', usage: 'Used to emphasize or describe' },
            { word: 'me', example: 'Can you help me with this?', usage: 'Refers to yourself' },
            { word: 'find', example: 'I need to find my lost shoe.', usage: 'To discover or locate something' },
            { word: 'see', example: 'I can see the bird in the tree.', usage: 'To look at with your eyes' }
          ]
        },
        {
          name: 'November Words',
          words: [
            { word: 'come', example: 'Please come to dinner.', usage: 'To move toward someone or something' },
            { word: 'some', example: 'I would like some milk.', usage: 'An amount that is not all' },
            { word: 'done', example: 'I am done with my homework.', usage: 'Finished or completed' },
            { word: 'one', example: 'I have one apple left.', usage: 'The number 1' },
            { word: 'none', example: 'There are none left in the box.', usage: 'Not any, zero' },
            { word: 'gone', example: 'The bus has gone already.', usage: 'Left or moved away' },
            { word: 'fun', example: 'Playing games is so much fun!', usage: 'Enjoyable or entertaining' },
            { word: 'run', example: 'I like to run in the park.', usage: 'To move quickly on your feet' },
            { word: 'sun', example: 'The sun is shining brightly.', usage: 'The bright star in our sky' },
            { word: 'bun', example: 'I ate a hot dog in a bun.', usage: 'A type of bread roll' }
          ]
        },
        {
          name: 'December Words',
          words: [
            { word: 'red', example: 'The apple is red and shiny.', usage: 'The color of fire trucks and roses' },
            { word: 'bed', example: 'I sleep in my bed at night.', usage: 'Furniture for sleeping' },
            { word: 'fed', example: 'I fed the dog this morning.', usage: 'Gave food to (past tense of feed)' },
            { word: 'led', example: 'The teacher led us to the library.', usage: 'Showed the way (past tense of lead)' },
            { word: 'wed', example: 'They got wed last summer.', usage: 'Married (past tense of wed)' },
            { word: 'said', example: 'She said hello to me.', usage: 'Spoke words (past tense of say)' },
            { word: 'paid', example: 'I paid for my lunch today.', usage: 'Gave money for something (past tense of pay)' },
            { word: 'laid', example: 'The hen laid an egg.', usage: 'Put something down (past tense of lay)' },
            { word: 'maid', example: 'The maid cleaned the room.', usage: 'A woman who cleans houses' },
            { word: 'afraid', example: 'I am afraid of the dark.', usage: 'Feeling scared or frightened' }
          ]
        },
        {
          name: 'January Words',
          words: [
            { word: 'blue', example: 'The sky is blue today.', usage: 'The color of the ocean and sky' },
            { word: 'true', example: 'It is true that cats like fish.', usage: 'Real or correct, not false' },
            { word: 'glue', example: 'I used glue to fix my toy.', usage: 'A sticky substance for joining things' },
            { word: 'clue', example: 'The footprint was a clue.', usage: 'A hint that helps solve a mystery' },
            { word: 'due', example: 'My homework is due tomorrow.', usage: 'Expected or supposed to happen' },
            { word: 'new', example: 'I got a new bike for my birthday.', usage: 'Not old, recently made or bought' },
            { word: 'few', example: 'There are only a few cookies left.', usage: 'A small number, not many' },
            { word: 'grew', example: 'The plant grew tall and strong.', usage: 'Got bigger (past tense of grow)' },
            { word: 'flew', example: 'The bird flew over the house.', usage: 'Moved through the air (past tense of fly)' },
            { word: 'drew', example: 'She drew a picture of a cat.', usage: 'Made a picture with pencil (past tense of draw)' }
          ]
        },
        {
          name: 'February Words',
          words: [
            { word: 'green', example: 'The grass is green in spring.', usage: 'The color of grass and leaves' },
            { word: 'seen', example: 'I have seen that movie before.', usage: 'Looked at with eyes (past tense of see)' },
            { word: 'been', example: 'I have been to the zoo.', usage: 'Existed or happened (past tense of be)' },
            { word: 'queen', example: 'The queen lives in a castle.', usage: 'A female ruler of a country' },
            { word: 'screen', example: 'I watch movies on the screen.', usage: 'The flat surface on TVs and computers' },
            { word: 'between', example: 'The cat sat between the dogs.', usage: 'In the middle of two things' },
            { word: 'fifteen', example: 'I am fifteen years old.', usage: 'The number 15' },
            { word: 'sixteen', example: 'There are sixteen candles on the cake.', usage: 'The number 16' },
            { word: 'seventeen', example: 'I counted seventeen birds.', usage: 'The number 17' },
            { word: 'eighteen', example: 'She will be eighteen next year.', usage: 'The number 18' }
          ]
        },
        {
          name: 'March Words',
          words: [
            { word: 'yellow', example: 'The sunflowers are bright yellow.', usage: 'The color of the sun and bananas' },
            { word: 'fellow', example: 'He is a nice fellow.', usage: 'A man or boy, a person' },
            { word: 'mellow', example: 'The music was soft and mellow.', usage: 'Gentle, soft, or relaxed' },
            { word: 'bellow', example: 'The cow will bellow loudly.', usage: 'To make a deep, loud sound' },
            { word: 'swallow', example: 'I will swallow my medicine.', usage: 'To take food or liquid down your throat' },
            { word: 'follow', example: 'Please follow me to the classroom.', usage: 'To go after someone or come behind' },
            { word: 'hollow', example: 'The tree trunk is hollow inside.', usage: 'Empty on the inside' },
            { word: 'pillow', example: 'I rest my head on my pillow.', usage: 'A soft cushion for your head' },
            { word: 'willow', example: 'The willow tree has long branches.', usage: 'A type of tree with drooping branches' },
            { word: 'billow', example: 'The clouds billow in the sky.', usage: 'To swell or move in waves' }
          ]
        }
      ]
    },
    math: {
      title: 'Math Facts & Numbers',
      icon: '🔢',
      categories: [
        {
          name: 'Addition Facts (0-10)',
          words: ['0+0=0', '1+1=2', '2+2=4', '3+3=6', '4+4=8', '5+5=10', '6+6=12', '7+7=14', '8+8=16', '9+9=18', '10+10=20']
        },
        {
          name: 'Subtraction Facts (0-10)',
          words: ['10-0=10', '10-1=9', '10-2=8', '10-3=7', '10-4=6', '10-5=5', '10-6=4', '10-7=3', '10-8=2', '10-9=1', '10-10=0']
        },
        {
          name: 'Skip Counting by 2s',
          words: ['2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30']
        },
        {
          name: 'Skip Counting by 5s',
          words: ['5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75']
        },
        {
          name: 'Skip Counting by 10s',
          words: ['10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150']
        },
        {
          name: 'Number Words (1-20)',
          words: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
        }
      ]
    },
    reading: {
      title: 'Reading Comprehension',
      icon: '📖',
      categories: [
        {
          name: 'Story Elements Questions',
          words: ['Who are the characters?', 'Where does the story take place?', 'When does the story happen?', 'What is the problem?', 'How is the problem solved?', 'What happens at the beginning?', 'What happens in the middle?', 'What happens at the end?']
        },
        {
          name: 'Sight Words (First 50)',
          words: ['a', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from', 'had', 'has', 'have', 'he', 'his', 'how', 'I', 'if', 'in', 'is', 'it', 'its', 'just', 'like', 'long', 'look', 'made', 'make', 'many', 'may', 'more', 'my', 'no', 'not', 'now', 'number', 'of', 'on', 'one', 'or', 'other', 'out', 'part', 'people', 'said', 'see', 'she', 'so', 'some']
        },
        {
          name: 'Rhyming Words',
          words: ['cat/hat/bat', 'dog/log/fog', 'sun/fun/run', 'cake/bake/make', 'ball/call/fall', 'tree/bee/see', 'car/star/far', 'book/look/cook', 'play/day/say', 'night/light/bright']
        }
      ]
    },
    science: {
      title: 'Science Vocabulary',
      icon: '🔬',
      categories: [
        {
          name: 'Weather Words',
          words: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'foggy', 'hot', 'cold', 'warm', 'cool', 'temperature', 'thermometer', 'precipitation', 'evaporation']
        },
        {
          name: 'Plant Parts',
          words: ['root', 'stem', 'leaf', 'flower', 'seed', 'fruit', 'bark', 'branch', 'trunk', 'petal', 'pollen', 'photosynthesis', 'germination', 'growth', 'nutrients']
        },
        {
          name: 'Animal Groups',
          words: ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect', 'spider', 'butterfly', 'bee', 'ant', 'frog', 'snake', 'turtle', 'whale', 'eagle']
        },
        {
          name: 'Body Parts',
          words: ['head', 'eyes', 'ears', 'nose', 'mouth', 'teeth', 'tongue', 'neck', 'shoulders', 'arms', 'hands', 'fingers', 'chest', 'stomach', 'legs', 'feet', 'toes']
        }
      ]
    }
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

  // Initialize daily challenge and learning streak
  useEffect(() => {
    const challenge = generateDailyChallenge();
    setDailyChallenge(challenge);
    
    // Load learning streak from localStorage
    const savedStreak = localStorage.getItem('learning-streak');
    const savedLastDate = localStorage.getItem('last-learning-date');
    if (savedStreak) setLearningStreak(parseInt(savedStreak));
    if (savedLastDate) setLastLearningDate(savedLastDate);
    
    // Load feedback from localStorage
    const savedFeedback = localStorage.getItem('emmy-feedback');
    if (savedFeedback) setFeedback(JSON.parse(savedFeedback));
    
    // Load parent mode from localStorage - default to Kids mode
    const savedParentMode = localStorage.getItem('emmy-parent-mode');
    if (savedParentMode !== null) {
      setParentMode(JSON.parse(savedParentMode));
    } else {
      // First time user - default to Kids mode and save it
      setParentMode(false);
      localStorage.setItem('emmy-parent-mode', 'false');
    }
  }, []);

  // Save learning streak
  useEffect(() => {
    localStorage.setItem('learning-streak', learningStreak.toString());
    if (lastLearningDate) {
      localStorage.setItem('last-learning-date', lastLearningDate);
    }
  }, [learningStreak, lastLearningDate]);

  // Save parent mode
  useEffect(() => {
    localStorage.setItem('emmy-parent-mode', JSON.stringify(parentMode));
  }, [parentMode]);

  // Auto-reset to Kids mode after 30 minutes of inactivity
  useEffect(() => {
    let inactivityTimer;
    
    const resetToKidsMode = () => {
      if (parentMode) {
        setParentMode(false);
        localStorage.setItem('emmy-parent-mode', 'false');
      }
    };
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(resetToKidsMode, 30 * 60 * 1000); // 30 minutes
    };
    
    // Reset timer on any user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    // Start the timer
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [parentMode]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 100); // Reduced threshold for easier testing
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Don't interfere with browser shortcuts (Cmd/Ctrl combinations)
      if (e.metaKey || e.ctrlKey) return;
      
      switch(e.key.toLowerCase()) {
        case 'h':
          navigateTo('home');
          break;
        case 'p':
            navigateTo('parent-reference');
          break;
        case 'a':
          navigateTo('achievements');
          break;
        case 'c':
          navigateTo('customize');
          break;
        case 'r':
          // Only trigger if not combined with shift (to avoid interfering with Cmd+Shift+R)
          if (!e.shiftKey) {
          navigateTo('progress');
          }
          break;
        case 's':
          setShowSearch(true);
          break;
        case 'm':
          toggleMusic();
          break;
        case 'escape':
          setShowSearch(false);
          break;
        case '1':
          navigateTo('phonics');
          setCurrentQuestion(0);
          break;
        case '2':
          navigateTo('math');
          setCurrentQuestion(0);
          break;
        case '3':
          navigateTo('reading');
          setCurrentQuestion(0);
          break;
        case '4':
          navigateTo('spelling');
          setCurrentQuestion(0);
          break;
        case '5':
          navigateTo('science');
          setCurrentQuestion(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
    const startTime = Date.now();
    const ok = sel === cor;
    const newScore = score + (ok ? 10 : 0);
      setScore(newScore);
    
    // Update confidence tracking
    const responseTime = Date.now() - startTime;
    const confidence = updateConfidenceLevel(currentScreen, ok, responseTime);
    
    // Update learning streak
    updateLearningStreak();
    
    // Update stats
    const currentStats = progress.stats || {
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      perfectScores: 0,
      timeSpent: 0,
      favoriteSubject: null
    };
    
    const updatedStats = {
      ...currentStats,
      totalQuestionsAnswered: currentStats.totalQuestionsAnswered + 1,
      correctAnswers: currentStats.correctAnswers + (ok ? 1 : 0),
      timeSpent: currentStats.timeSpent + 1 // Simple time tracking
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
        const subjectScore = Math.round((newScore / (questionCount * 10)) * 100);
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
              questionsAnswered: questionCount,
              correctAnswers: Math.floor(newScore / 10)
            }
          }
        };
        
        // Update perfect scores count
        if (isPerfectScore) {
          newProgress.stats = newProgress.stats || {};
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

  const resetGame = () => { 
    setCurrentQuestion(0); 
    setScore(0); 
    navigateTo('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle game selection with question count
  const handleGameSelection = (gameType) => {
    console.log('Game selected:', gameType);
    setPendingGame(gameType);
    setShowQuestionSelector(true);
  };

  // Start game with selected question count
  const startGameWithCount = () => {
    const questionCount = selectedQuestionCount === 'custom' 
      ? parseInt(customQuestionCount) 
      : selectedQuestionCount;
    
    if (questionCount < 1 || questionCount > 100) {
      alert('Please enter a number between 1 and 100');
      return;
    }
    
    setShowQuestionSelector(false);
    setCurrentQuestion(0);
    setScore(0);
    navigateTo(pendingGame);
    setPendingGame(null);
    setCustomQuestionCount('');
    setSelectedQuestionCount(10);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentScreen === 'home') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const currentAvatar = avatars[progress.avatar] || avatars.default;
    
    // Question Count Selector Modal (rendered for both kids and parent modes)
    const questionSelectorModal = showQuestionSelector && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">How many questions?</h3>
            <p className="text-gray-600">Choose how many questions you want to practice!</p>
          </div>
          
          <div className="space-y-4">
            {/* Preset Options */}
            <div className="grid grid-cols-2 gap-3">
              {[5, 10, 20, 40].map(count => (
                <button
                  key={count}
                  onClick={() => setSelectedQuestionCount(count)}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    selectedQuestionCount === count
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
            
            {/* Custom Option */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom amount:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customQuestionCount}
                  onChange={(e) => {
                    setCustomQuestionCount(e.target.value);
                    setSelectedQuestionCount('custom');
                  }}
                  placeholder="Enter number (1-100)"
                  min="1"
                  max="100"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    setSelectedQuestionCount('custom');
                    setCustomQuestionCount('');
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-all ${
                    selectedQuestionCount === 'custom'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowQuestionSelector(false);
                setPendingGame(null);
                setCustomQuestionCount('');
                setSelectedQuestionCount(10);
              }}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startGameWithCount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Start Game! 🎮
            </button>
          </div>
        </div>
      </div>
    );
    
    // Kid-friendly simplified interface
    if (!parentMode) {
    return (
      <>
        {questionSelectorModal}
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
          {/* Mode Toggle - Top Left */}
          <div className="absolute top-4 left-4 z-30">
            <div className="bg-white rounded-full p-1 shadow-lg border-2 border-purple-200">
              <div className="flex">
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !parentMode 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'bg-transparent text-purple-600 hover:bg-purple-50'
                  }`}
                  onClick={() => setParentMode(false)}
                  title="Kids Mode (Default)"
                >
                  👶 Kids
                </button>
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    parentMode 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'bg-transparent text-purple-600 hover:bg-purple-50'
                  }`}
                  onClick={() => setParentMode(true)}
                  title="Switch to Parent Mode"
                >
                  👨‍👩‍👧‍👦 Parents
                </button>
              </div>
            </div>
            {/* Default Mode Indicator */}
            <div className="mt-2 text-center">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                ✨ Kids Mode (Default)
              </span>
            </div>
            {/* Search Button for Kids */}
            <div className="mt-2">
              <button
                onClick={() => setShowSearch(true)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium transition-colors shadow-sm"
                title="Search for games and topics"
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Enhanced Achievement Notification */}
          {showAchievement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl border-4 border-yellow-300 animate-bounce">
                <div className="text-8xl mb-4 animate-pulse">🏆</div>
                <h2 className="text-3xl font-bold text-purple-800 mb-2 rainbow">Achievement Unlocked!</h2>
                <p className="text-xl text-gray-700 mb-2 font-semibold">{achievements[showAchievement]?.name}</p>
                <p className="text-sm text-gray-600 mb-6">{achievements[showAchievement]?.description}</p>
                <div className="bg-yellow-200 rounded-full px-4 py-2 mb-6 inline-block">
                  <span className="font-bold text-yellow-800">+{achievements[showAchievement]?.points || 50} Points!</span>
                </div>
                <button
                  onClick={() => setShowAchievement(null)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg"
                >
                  Awesome! 🎉
                </button>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-6xl float">{currentAvatar.emoji}</div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2 rainbow">✨ Emmy's Learning Adventure ✨</h1>
                  <div className="text-lg text-purple-600 pulse">Hi {currentAvatar.name}! Ready to learn?</div>
                </div>
              </div>
              
              {/* Enhanced Progress Display */}
              <div className="bg-white rounded-2xl p-6 shadow-xl inline-block">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-700">🏆 {progress.totalScore}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700">{Object.keys(progress.completedSubjects).length}/10</div>
                    <div className="text-sm text-gray-600">Subjects</div>
                    {/* Progress Ring */}
                    <div className="w-16 h-16 mx-auto mt-2 relative">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray={`${(Object.keys(progress.completedSubjects).length / 10) * 100}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-700">
                          {Math.round((Object.keys(progress.completedSubjects).length / 10) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-700">🔥 {learningStreak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                    {learningStreak > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {learningStreak === 1 ? 'Great start!' : 
                         learningStreak < 7 ? 'Keep it up!' : 
                         learningStreak < 30 ? 'Amazing!' : 'Incredible!'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Challenge - Kid Friendly */}
            {dailyChallenge && (
              <div className="mb-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 shadow-xl border-4 border-yellow-300 text-center">
                <div className="text-4xl mb-2">{dailyChallenge.icon}</div>
                <h3 className="text-xl font-bold text-orange-800 mb-2">Today's Challenge!</h3>
                <p className="text-orange-600 mb-3">{dailyChallenge.description}</p>
                <div className="bg-orange-200 rounded-full px-4 py-2 inline-block">
                  <span className="font-bold text-orange-800">Reward: {dailyChallenge.reward} points</span>
                </div>
              </div>
            )}


            {/* Learning Games - Main Section */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">🎮 Learning Games</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <div key={game.name} onClick={() => { console.log('Button clicked:', game.name); handleGameSelection(game.name); }}
                    className={`bg-gradient-to-br ${game.color} p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform relative hover:wiggle`}>
                    <div className="text-3xl md:text-4xl mb-2 sparkle">{game.icon}</div>
                    <h2 className="text-sm md:text-base font-bold text-white mb-1">{game.title}</h2>
                    {progress.completedSubjects[game.name] && (
                      <div className="absolute top-1 right-1 text-lg sparkle">🏆</div>
                    )}
                    {progress.completedSubjects[game.name] && (
                      <div className="text-xs text-yellow-200 mt-1 font-semibold">Score: {progress.completedSubjects[game.name].score}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Study Guides - Kid Friendly */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">📚 Study Guides</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {Object.keys(studyGuides).map(type => (
                <div key={type} onClick={() => { navigateTo(`guide-${type}`); }} 
                  className="bg-gradient-to-br from-pink-300 to-pink-500 p-3 rounded-lg shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                  <div className="text-xl mb-1">{studyGuides[type].icon}</div>
                  <h3 className="text-xs font-bold text-white">{studyGuides[type].title}</h3>
                  {progress.completedSubjects[type] && <div className="text-xs text-yellow-200 mt-1">✅</div>}
                </div>
              ))}
              </div>
            </div>

            {/* Quick Actions for Kids */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-center text-purple-700 mb-4">⚡ Quick Actions</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                <div onClick={() => {
                  const subjects = ['phonics', 'math', 'reading', 'spelling', 'science', 'social', 'skipcounting', 'art', 'geography', 'history'];
                  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                  navigateTo(randomSubject);
                  setCurrentQuestion(0);
                }} 
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-lg">
                  🎲 Random Game
                </div>
                {progress.lastPlayedSubject && (
                  <div onClick={() => {
                    navigateTo(progress.lastPlayedSubject);
                    setCurrentQuestion(0);
                  }} 
                    className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-bold cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-lg">
                    🔄 Continue Last
                  </div>
                )}
                <div onClick={() => navigateTo('achievements')} 
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full font-bold cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-lg">
                  🏅 My Awards
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              <div onClick={() => navigateTo('customize')} 
                className="px-6 py-3 bg-green-500 text-white rounded-full font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition-transform">
                🎨 Customize
              </div>
              <div onClick={() => { playSound('click'); triggerHaptic('light'); toggleMusic(); }} 
                className={`px-6 py-3 text-white rounded-full font-bold cursor-pointer hover:opacity-80 active:scale-95 transition-transform ${isMusicPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isMusicPlaying ? '🔇 Music Off' : '🎵 Music On'}
              </div>
            </div>
          </div>
        </div>
      </>
    );
    }
    
    // Parent Mode - Full Interface
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        {/* Mode Toggle - Top Left */}
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-white rounded-full p-1 shadow-lg border-2 border-purple-200">
            <div className="flex">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !parentMode 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'bg-transparent text-purple-600 hover:bg-purple-50'
                }`}
                onClick={() => setParentMode(false)}
                title="Switch to Kids Mode (Default)"
              >
                👶 Kids
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  parentMode 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'bg-transparent text-purple-600 hover:bg-purple-50'
                }`}
                onClick={() => setParentMode(true)}
                title="Switch to Parent Mode"
              >
                👨‍👩‍👧‍👦 Parents
              </button>
            </div>
          </div>
          {/* Reset to Kids Mode Button */}
          <div className="mt-2">
            <button
              onClick={() => {
                setParentMode(false);
                localStorage.setItem('emmy-parent-mode', 'false');
              }}
              className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1 rounded-full text-xs font-medium transition-colors shadow-sm"
              title="Reset to Kids Mode (Default)"
            >
              🔄 Reset to Kids
            </button>
          </div>
        </div>

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

        {/* Search Interface */}
        {showSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search words, subjects, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {searchQuery && (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults().length > 0 ? (
                    <div className="space-y-2">
                      {searchResults().map((result, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (result.type === 'word') {
                              navigateTo('parent-reference');
                              setSelectedSubject(result.subject.toLowerCase().replace(' word lists', '').replace(' facts & numbers', '').replace(' comprehension', '').replace(' vocabulary', ''));
                            } else {
                              navigateTo(result.screen);
                            }
                          }}
                          className="p-4 bg-gray-50 rounded-xl hover:bg-purple-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{result.icon || '📝'}</span>
                            <div>
                              <div className="font-bold text-gray-800">{result.word || result.subject}</div>
                              {result.category && <div className="text-sm text-gray-600">{result.category}</div>}
                              {result.example && <div className="text-sm text-gray-500 italic">"{result.example}"</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <div>No results found for "{searchQuery}"</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation - Only show if not on home page */}
        {currentScreen !== 'home' && (
          <div className="mb-4 flex items-center justify-between">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span>›</span>}
                  <span className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}>
                    {crumb}
                  </span>
                </div>
              ))}
            </nav>
            
            {/* Keyboard Shortcuts Help */}
            <div className="hidden md:block text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
            </div>
          </div>
        )}

          {/* Keyboard Shortcuts Help for Home Page */}
          {currentScreen === 'home' && (
            <div className="mb-4 flex justify-end pr-20">
              <div className="hidden md:block text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
              </div>
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
            {/* Progress Stats - Enhanced */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                  <div className="text-3xl font-bold text-purple-700">🏆 {progress.totalScore}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
              </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">{Object.keys(progress.completedSubjects).length}/10</div>
                  <div className="text-sm text-gray-600">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-700">{progress.achievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
            </div>
          </div>
          
          
            {/* Main Action Buttons - Streamlined */}
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <div onClick={() => navigateTo('achievements')} 
                className="px-6 py-3 bg-yellow-500 text-white rounded-full font-bold cursor-pointer hover:bg-yellow-600 active:scale-95 transition-transform">
                🏅 Achievements
              </div>
              <div onClick={() => navigateTo('customize')} 
                className="px-6 py-3 bg-green-500 text-white rounded-full font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition-transform">
                🎨 Customize
              </div>
              <div onClick={() => navigateTo('progress')} 
                className="px-6 py-3 bg-indigo-500 text-white rounded-full font-bold cursor-pointer hover:bg-indigo-600 active:scale-95 transition-transform">
                📊 Progress
              </div>
              <div onClick={() => setShowSearch(true)} 
                className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition-transform">
                🔍 Search
              </div>
              <div onClick={() => navigateTo('feedback')} 
                className="px-6 py-3 bg-pink-500 text-white rounded-full font-bold cursor-pointer hover:bg-pink-600 active:scale-95 transition-transform">
                💬 Feedback
              </div>
              <div onClick={() => navigateTo('newsletter')} 
                className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold cursor-pointer hover:bg-blue-600 active:scale-95 transition-transform">
                📰 Newsletter
              </div>
              <div onClick={() => { playSound('click'); triggerHaptic('light'); toggleMusic(); }} 
                className={`px-6 py-3 text-white rounded-full font-bold cursor-pointer hover:opacity-80 active:scale-95 transition-transform ${isMusicPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isMusicPlaying ? '🔇 Music Off' : '🎵 Music On'}
              </div>
            </div>
            
            {/* Difficulty Selector - More Compact */}
            <div className="mt-4 flex justify-center gap-2">
              {['easy', 'medium', 'hard'].map(level => (
                <div key={level} 
                  onClick={() => { playSound('click'); triggerHaptic('light'); setDifficulty(level); }}
                  className={`px-4 py-2 rounded-full font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 text-sm ${
                    difficulty === level 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}>
                  {level === 'easy' ? '😊 Easy' : level === 'medium' ? '😐 Medium' : '😤 Hard'}
                </div>
              ))}
            </div>
          </div>
          
          {/* Monthly Learning Plans */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">📅 Monthly Learning Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Week 1 Plan */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🌱</div>
                  <h3 className="text-lg font-bold text-blue-800">Week 1: Foundation</h3>
                  <p className="text-sm text-blue-600">Start with basics</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Phonics & Math (Easy)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Reading Basics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Science Introduction</span>
                  </div>
                </div>
              </div>
              
              {/* Week 2 Plan */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🌿</div>
                  <h3 className="text-lg font-bold text-green-800">Week 2: Building</h3>
                  <p className="text-sm text-green-600">Expand knowledge</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Math & Spelling (Medium)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Social Studies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Skip Counting</span>
                  </div>
                </div>
              </div>
              
              {/* Week 3 Plan */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🌺</div>
                  <h3 className="text-lg font-bold text-purple-800">Week 3: Advanced</h3>
                  <p className="text-sm text-purple-600">Master skills</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Art & Geography</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>History & Hard Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>All Achievements</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Tracker */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-purple-700 mb-4 text-center">📊 This Month's Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.min(Object.keys(progress.completedSubjects).length, 3)}/3
                  </div>
                  <div className="text-sm text-gray-600">Week 1 Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(0, Math.min(Object.keys(progress.completedSubjects).length - 3, 3))}/3
                  </div>
                  <div className="text-sm text-gray-600">Week 2 Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(0, Math.min(Object.keys(progress.completedSubjects).length - 6, 4))}/4
                  </div>
                  <div className="text-sm text-gray-600">Week 3 Goals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Tools & Reference */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-center text-purple-800 mb-3">📚 Parent Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Word Lists & Quiz */}
              <div onClick={() => navigateTo('parent-reference')} 
                className="bg-gradient-to-br from-purple-400 to-indigo-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📱</div>
                <h3 className="text-sm font-bold text-white">Word Lists</h3>
                <p className="text-xs text-purple-100">Quick reference</p>
              </div>

              {/* Learning Progress */}
              <div onClick={() => navigateTo('progress')} 
                className="bg-gradient-to-br from-blue-400 to-cyan-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📊</div>
                <h3 className="text-sm font-bold text-white">Progress</h3>
                <p className="text-xs text-blue-100">Track progress</p>
              </div>

              {/* Achievements */}
              <div onClick={() => navigateTo('achievements')} 
                className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">🏅</div>
                <h3 className="text-sm font-bold text-white">Awards</h3>
                <p className="text-xs text-yellow-100">View rewards</p>
              </div>

              {/* Feedback */}
              <div onClick={() => navigateTo('feedback')} 
                className="bg-gradient-to-br from-pink-400 to-rose-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">💬</div>
                <h3 className="text-sm font-bold text-white">Feedback</h3>
                <p className="text-xs text-pink-100">Share thoughts</p>
              </div>

              {/* Newsletter */}
              <div onClick={() => navigateTo('newsletter')} 
                className="bg-gradient-to-br from-blue-400 to-indigo-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📰</div>
                <h3 className="text-sm font-bold text-white">Newsletter</h3>
                <p className="text-xs text-blue-100">Week 10</p>
              </div>
            </div>
          </div>
          
          {/* Study Guides Section */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-center text-purple-800 mb-3">📚 Study Guides</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {Object.keys(studyGuides).map(type => (
                <div key={type} onClick={() => { navigateTo(`guide-${type}`); }} 
                  className="bg-gradient-to-br from-pink-300 to-pink-500 p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                  <div className="text-2xl md:text-3xl mb-2">{studyGuides[type].icon}</div>
                  <h3 className="text-xs md:text-sm font-bold text-white">{studyGuides[type].title}</h3>
                  {progress.completedSubjects[type] && <div className="text-xs text-yellow-200 mt-1">✅ Complete</div>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-200 p-4 md:hidden z-30">
          <div className="flex justify-around items-center">
            <button onClick={() => navigateTo('home')} className="flex flex-col items-center gap-1 p-2">
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-bold text-purple-600">Home</span>
            </button>
            <button onClick={() => navigateTo('parent-reference')} className="flex flex-col items-center gap-1 p-2">
              <span className="text-2xl">📱</span>
              <span className="text-xs font-bold text-purple-600">Reference</span>
            </button>
            <button onClick={() => setShowSearch(true)} className="flex flex-col items-center gap-1 p-2">
              <span className="text-2xl">🔍</span>
              <span className="text-xs font-bold text-purple-600">Search</span>
            </button>
            <button onClick={() => navigateTo('progress')} className="flex flex-col items-center gap-1 p-2">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-bold text-purple-600">Progress</span>
            </button>
            <button onClick={() => navigateTo('achievements')} className="flex flex-col items-center gap-1 p-2">
              <span className="text-2xl">🏅</span>
              <span className="text-xs font-bold text-purple-600">Awards</span>
            </button>
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
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
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
            <div onClick={() => { playSound('click'); setCurrentScreen(type); setCurrentQuestion(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
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
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
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
            <div onClick={() => { if(currentQuestion<spellingWords.length-1) { setCurrentQuestion(currentQuestion+1); triggerHaptic('light'); } else { navigateTo('home'); triggerHaptic('success'); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} 
              className="px-6 py-3 font-bold bg-purple-500 text-white rounded-full cursor-pointer active:scale-95 transition-transform">
              {currentQuestion < spellingWords.length-1 ? 'Next →' : 'Done 🎉'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'complete') {
    const percentage = Math.round((score / (currentQuestion * 10)) * 100);
    const subjectName = {
      'phonics': 'Phonics',
      'math': 'Math', 
      'reading': 'Reading',
      'spelling': 'Spelling',
      'science': 'Science',
      'social': 'Social Studies',
      'skipcounting': 'Skip Counting',
      'art': 'Art',
      'geography': 'Geography',
      'history': 'History'
    }[currentScreen] || currentScreen;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-200 to-orange-300 p-8 flex items-center justify-center">
        <div className="max-w-2xl bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="text-9xl mb-6">🏆</div>
          <h2 className="text-4xl md:text-5xl font-bold text-yellow-600 mb-4">Amazing Job!</h2>
          <p className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">Score: {score} ⭐</p>
          <p className="text-xl text-gray-600 mb-8">You completed {subjectName} with {percentage}% accuracy!</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div onClick={() => { playSound('click'); resetGame(); }} className="inline-block px-8 py-4 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:scale-110 cursor-pointer">Play Again! 🎮</div>
            <div onClick={() => { playSound('click'); setShowShareModal(true); }} className="inline-block px-8 py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-110 cursor-pointer">Share with Parents! 📧</div>
        </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Share Your Success!</h3>
                <p className="text-gray-600">Let your parents know about your amazing progress!</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent's Email</label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="mom@example.com or dad@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Your Results:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Subject: {subjectName}</p>
                    <p>• Score: {score} points</p>
                    <p>• Accuracy: {percentage}%</p>
                    <p>• Questions: {currentQuestion}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailShare}
                  disabled={!shareEmail}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Send Email 📧
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentScreen === 'achievements') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const earnedAchievements = progress.achievements || [];
    const totalPoints = earnedAchievements.reduce((sum, id) => sum + (achievements[id]?.points || 0), 0);
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                <span 
                  className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}
                  onClick={() => {
                    if (index === 0) {
                      navigateTo('home');
                    } else if (index === 1) {
                      navigateTo('achievements');
                    }
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
          </div>
        </div>

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
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                <span 
                  className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}
                  onClick={() => {
                    if (index === 0) {
                      navigateTo('home');
                    } else if (index === 1) {
                      navigateTo('customize');
                    }
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
          </div>
        </div>

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
    const accuracy = (progress.stats && progress.stats.totalQuestionsAnswered > 0) 
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
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                <span 
                  className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}
                  onClick={() => {
                    if (index === 0) {
                      navigateTo('home');
                    } else if (index === 1) {
                      navigateTo('progress');
                    }
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
          </div>
        </div>

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
                  <span className="font-bold">{progress.stats?.totalQuestionsAnswered || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answers:</span>
                  <span className="font-bold text-green-600">{progress.stats?.correctAnswers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Perfect Scores:</span>
                  <span className="font-bold text-yellow-600">{progress.stats?.perfectScores || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Score:</span>
                  <span className="font-bold text-blue-600">{averageScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Learning Streak:</span>
                  <span className="font-bold text-orange-600">🔥 {learningStreak} days</span>
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
              <h3 className="text-xl font-bold text-purple-700 mb-4">💪 Confidence Levels</h3>
              <div className="space-y-3">
                {Object.entries(confidenceLevels).map(([subject, confidence]) => {
                  const subjectNames = {
                    phonics: 'Phonics', math: 'Math', reading: 'Reading', 
                    spelling: 'Spelling', science: 'Science', social: 'Citizenship',
                    skipcounting: 'Skip Counting', art: 'Art', geography: 'Geography', history: 'History'
                  };
                  const confidenceColor = confidence >= 0.8 ? 'text-green-600' : 
                                        confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';
                  const confidenceBar = Math.round(confidence * 100);
                  
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{subjectNames[subject] || subject}</span>
                        <span className={`font-bold ${confidenceColor}`}>{confidenceBar}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            confidence >= 0.8 ? 'bg-green-500' : 
                            confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${confidenceBar}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(confidenceLevels).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-2xl mb-2">📊</div>
                    <div>Start learning to see confidence levels!</div>
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
          
          {/* Print Report and Share Buttons */}
          <div className="text-center mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.print()}
              className="px-8 py-4 bg-purple-500 text-white rounded-full font-bold text-lg hover:bg-purple-600 active:scale-95 transition-transform shadow-lg">
              🖨️ Print Progress Report
            </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-blue-600 active:scale-95 transition-transform shadow-lg">
                📧 Share Progress with Parents
            </button>
          </div>
        </div>
        </div>

        {/* Progress Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Share Learning Progress!</h3>
                <p className="text-gray-600">Let parents know about your amazing learning journey!</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent's Email</label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="mom@example.com or dad@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a personal message about your learning..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Overall Progress Summary:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Total Points: {progress.totalScore}</p>
                    <p>• Subjects Completed: {completedSubjects}/{totalSubjects}</p>
                    <p>• Overall Accuracy: {accuracy}%</p>
                    <p>• Questions Answered: {progress.stats?.totalQuestionsAnswered || 0}</p>
                    <p>• Achievements Earned: {progress.achievements.length}</p>
                    <p>• Learning Streak: {learningStreak} days</p>
                    {favoriteSubject && <p>• Favorite Subject: {favoriteSubject.name}</p>}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const emailSubject = `🎉 Learning Progress Update - Great Job!`;
                    const emailBody = `
Hi! 

I wanted to share my amazing learning progress in Emmy's Learning Adventure! 

📊 My Overall Progress:
• Total Points: ${progress.totalScore}
• Subjects Completed: ${completedSubjects}/${totalSubjects}
• Overall Accuracy: ${accuracy}%
• Questions Answered: ${progress.stats?.totalQuestionsAnswered || 0}
• Achievements Earned: ${progress.achievements.length}
• Learning Streak: ${learningStreak} days
${favoriteSubject ? `• Favorite Subject: ${favoriteSubject.name}` : ''}

${shareMessage || "I'm so proud of my learning journey! 🎉"}

Keep encouraging my education! 

Love,
Your Student 🌟
                    `.trim();

                    const mailtoLink = `mailto:${shareEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    window.open(mailtoLink);
                    setShowShareModal(false);
                    setShareEmail('');
                    setShareMessage('');
                  }}
                  disabled={!shareEmail}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Send Email 📧
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentScreen === 'feedback') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    const feedbackStats = getFeedbackStats();
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                <span 
                  className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}
                  onClick={() => {
                    if (index === 0) {
                      navigateTo('home');
                    } else if (index === 1) {
                      navigateTo('feedback');
                    }
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">💬 Feedback & Suggestions</h1>
            <p className="text-lg text-purple-600">Help us improve Emmy's learning experience!</p>
          </div>

          {/* Feedback Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">📊 Feedback Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{feedbackStats.total}</div>
                <div className="text-gray-600">Total Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">{feedbackStats.avgRating.toFixed(1)}</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">{Object.keys(feedbackStats.categories).length}</div>
                <div className="text-gray-600">Categories</div>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">✍️ Share Your Feedback</h2>
            
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  value={feedbackCategory} 
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="content">Content Suggestion</option>
                  <option value="ui">UI/UX Improvement</option>
                  <option value="performance">Performance Issue</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5 stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`text-3xl ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you think! What's working well? What could be improved? Any suggestions for new features or content?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitFeedback}
                disabled={!feedbackMessage.trim()}
                className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📤 Submit Feedback
              </button>
            </div>
          </div>

          {/* Recent Feedback */}
          {feedback.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-purple-700 mb-6">📝 Recent Feedback</h2>
              <div className="space-y-4">
                {feedback.slice(-5).reverse().map(item => (
                  <div key={item.id} className="border-l-4 border-purple-300 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600 capitalize">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`text-sm ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentScreen === 'newsletter' || currentScreen.startsWith('newsletter-')) {
    // Show newsletter selector if no specific newsletter is selected
    if (!selectedNewsletter) {
      return (
        <NewsletterSelector 
          onSelectNewsletter={(week) => {
            navigateTo('newsletter', '', { week: week });
          }}
          onBack={() => {
            navigateTo('home');
            setSelectedNewsletter(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }
    
    // Show specific newsletter based on selection
    const newsletterComponents = {
      8: Week8Newsletter,
      9: Week9Newsletter,
      10: Week10Newsletter
    };
    
    const NewsletterComponent = newsletterComponents[selectedNewsletter];
    
    if (NewsletterComponent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
            <NewsletterComponent onBack={() => {
            navigateTo('newsletter');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        </div>
      );
    }
  }

  if (currentScreen === 'parent-reference') {
    const currentTheme = themes[progress.selectedTheme] || themes.default;
    
    const subject = parentReference[selectedSubject];
    const category = subject ? subject.categories[selectedCategory] : null;
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors} p-4 md:p-8`}>
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>›</span>}
                <span 
                  className={index === breadcrumbs.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-500 cursor-pointer'}
                  onClick={() => {
                    if (index === 0) {
                      navigateTo('home');
                    } else if (index === 1) {
                      navigateTo('parent-reference');
                    }
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Keyboard Shortcuts Help */}
          <div className="hidden md:block text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Press S to search</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4">📱 Parent Quick Reference</h1>
            <p className="text-lg text-purple-600">Easy access to word lists for quizzing Emmy on the go!</p>
          </div>
          
          {/* Subject Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">📚 Choose Subject</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(parentReference).map(([key, subject]) => (
                <div key={key} 
                  onClick={() => { 
                    navigateTo('parent-reference', '', { subject: key, category: 0 });
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                    selectedSubject === key 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{subject.icon}</div>
                    <div className="font-bold text-sm">{subject.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Category Selection */}
          {subject && (
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
              <h2 className="text-2xl font-bold text-purple-700 mb-4">📋 Choose Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subject.categories.map((category, index) => (
                  <div key={index} 
                    onClick={() => { 
                      navigateTo('parent-reference', '', { subject: selectedSubject, category: index });
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                      selectedCategory === index 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    <div className="font-bold text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{category.words.length} items</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Word List Display */}
          {category && (
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-purple-700">{category.name}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      playSound('click'); 
                      triggerHaptic('light'); 
                      setParentQuizMode(!parentQuizMode); 
                      setParentQuizWord(0); 
                    }}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 ${
                      parentQuizMode 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                    {parentQuizMode ? '📝 Quiz Mode' : '🎯 Start Quiz'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-500 text-white rounded-full font-bold text-sm hover:bg-gray-600 active:scale-95 transition-transform">
                    🖨️ Print
                  </button>
                </div>
              </div>
              
              {parentQuizMode ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-3xl font-bold text-purple-700 mb-6">
                    Word {parentQuizWord + 1} of {category.words.length}
                  </h3>
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-8 rounded-2xl border-4 border-yellow-300 mb-6">
                    <div className="text-4xl md:text-6xl font-bold text-purple-800 mb-4">
                      {typeof category.words[parentQuizWord] === 'string' 
                        ? category.words[parentQuizWord] 
                        : category.words[parentQuizWord].word}
                    </div>
                    {typeof category.words[parentQuizWord] === 'object' && category.words[parentQuizWord].example && (
                      <div className="mb-4">
                        <div className="text-lg text-gray-700 mb-2 italic">"{category.words[parentQuizWord].example}"</div>
                        <div className="text-sm text-gray-600">{category.words[parentQuizWord].usage}</div>
                      </div>
                    )}
                    <p className="text-lg text-gray-600">Ask Emmy to spell this word!</p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => { 
                        if (parentQuizWord > 0) { 
                          setParentQuizWord(parentQuizWord - 1); 
                          triggerHaptic('light'); 
                        } 
                      }}
                      className={`px-6 py-3 rounded-full font-bold ${
                        parentQuizWord > 0 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}>
                      ← Previous
                    </button>
                    <button 
                      onClick={() => { 
                        if (parentQuizWord < category.words.length - 1) { 
                          setParentQuizWord(parentQuizWord + 1); 
                          triggerHaptic('light'); 
                        } else { 
                          setParentQuizMode(false); 
                          triggerHaptic('success'); 
                        } 
                      }}
                      className="px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 active:scale-95 transition-transform">
                      {parentQuizWord < category.words.length - 1 ? 'Next →' : 'Finish Quiz 🎉'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.words.map((wordItem, index) => {
                    const word = typeof wordItem === 'string' ? wordItem : wordItem.word;
                    const example = typeof wordItem === 'object' ? wordItem.example : null;
                    const usage = typeof wordItem === 'object' ? wordItem.usage : null;
                    
                    return (
                      <div key={index} 
                        className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-xl border-2 border-purple-200 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => {
                          playSound('click');
                          triggerHaptic('light');
                          setParentQuizMode(true);
                          setParentQuizWord(index);
                        }}>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-800 mb-2">{word}</div>
                          {example && (
                            <div className="text-sm text-gray-700 mb-2 italic">"{example}"</div>
                          )}
                          {usage && (
                            <div className="text-xs text-gray-600 mb-2">{usage}</div>
                          )}
                          <div className="text-xs text-purple-600 font-bold">Tap to quiz</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-purple-700 mb-4">💡 Quick Tips for Parents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-bold text-purple-600 mb-2">📱 Mobile-Friendly</h4>
                <p className="text-gray-700">This screen is optimized for mobile devices. Perfect for quizzing Emmy while waiting in line or during car rides!</p>
              </div>
              <div>
                <h4 className="font-bold text-purple-600 mb-2">🎯 Quiz Mode</h4>
                <p className="text-gray-700">Use Quiz Mode to go through words one by one. Great for focused practice sessions!</p>
              </div>
              <div>
                <h4 className="font-bold text-purple-600 mb-2">🖨️ Print Lists</h4>
                <p className="text-gray-700">Print any word list for offline practice. Perfect for homework time or quiet activities!</p>
              </div>
              <div>
                <h4 className="font-bold text-purple-600 mb-2">📚 All Subjects</h4>
                <p className="text-gray-700">Access phonics, spelling, math facts, sight words, and science vocabulary all in one place!</p>
              </div>
            </div>
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
  
  // Get the full question set and slice it to the selected count
  const fullQuestionSet = questionSets[currentScreen] || [];
  const questionCount = selectedQuestionCount === 'custom' 
    ? parseInt(customQuestionCount) || 10
    : selectedQuestionCount;
  const qs = fullQuestionSet.slice(0, questionCount);
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
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg hover:scale-105 cursor-pointer">← Back</div>
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
          <p className="text-xl md:text-2xl text-gray-600">Question {currentQuestion+1} of {questionCount}</p>
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
      
      {/* Quick Feedback Button */}
      {currentScreen !== 'home' && currentScreen !== 'feedback' && (
        <button
          onClick={() => navigateTo('feedback')}
          className="fixed bottom-4 right-4 z-40 bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
          title="Quick Feedback"
        >
          💬
        </button>
      )}

      {/* Scroll to Top Button */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white"
          title="Scroll to top"
        >
          ↑
        </button>
      </div>
      
    </div>
  );
};

// Main App Component with URL Routing
const App = () => {
  return (
    <BrowserRouter basename="/emmys-learning-app">
      <Routes>
        <Route path="/" element={<EmmyStudyGame />} />
        
        {/* Newsletter Routes */}
        <Route path="/newsletter" element={<EmmyStudyGame />} />
        <Route path="/newsletter/:week" element={<EmmyStudyGame />} />
        
        {/* Parent Reference Routes */}
        <Route path="/parent-reference" element={<EmmyStudyGame />} />
        <Route path="/parent-reference/:subject" element={<EmmyStudyGame />} />
        <Route path="/parent-reference/:subject/:category" element={<EmmyStudyGame />} />
        
        {/* Game Routes */}
        <Route path="/spelling" element={<EmmyStudyGame />} />
        <Route path="/spelling/:mode" element={<EmmyStudyGame />} />
        
        {/* Progress & Achievement Routes */}
        <Route path="/achievements" element={<EmmyStudyGame />} />
        <Route path="/achievements/:category" element={<EmmyStudyGame />} />
        <Route path="/progress" element={<EmmyStudyGame />} />
        <Route path="/progress/:section" element={<EmmyStudyGame />} />
        
        {/* Settings Routes */}
        <Route path="/customize" element={<EmmyStudyGame />} />
        <Route path="/customize/:section" element={<EmmyStudyGame />} />
        <Route path="/feedback" element={<EmmyStudyGame />} />
        <Route path="/feedback/:category" element={<EmmyStudyGame />} />
        
        {/* Fallback */}
        <Route path="*" element={<EmmyStudyGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

