import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Week11Newsletter from './Week11Newsletter';
import Week10Newsletter from './Week10Newsletter';
import Week9Newsletter from './Week9Newsletter';
import Week8Newsletter from './Week8Newsletter';
import Week7Newsletter from './Week7Newsletter';
import NewsletterSelector from './NewsletterSelector';
import FieldTrips from './FieldTrips';
import textToSpeech from './utils/textToSpeech';

// EmailJS for direct email sending
import emailjs from '@emailjs/browser';

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
  // Get current month for default spelling selection
  const getCurrentMonth = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11 (January = 0)
    const monthMap = {
      9: 'october',   // October
      10: 'november', // November  
      11: 'december', // December
      0: 'january',   // January
      1: 'february',  // February
      2: 'march'      // March
    };
    return monthMap[month] || 'all'; // Default to 'all' if not in our range
  };

  const [selectedSpellingMonth, setSelectedSpellingMonth] = useState(getCurrentMonth());
  const [selectedPhonicsDifficulty, setSelectedPhonicsDifficulty] = useState('medium');
  const [selectedMathDifficulty, setSelectedMathDifficulty] = useState('medium');
  const [selectedReadingCategory, setSelectedReadingCategory] = useState('all');
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState(new Date().getMonth());
  const [lastLearningDate, setLastLearningDate] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [showWrongAnswerModal, setShowWrongAnswerModal] = useState(false);
  const [wrongAnswerData, setWrongAnswerData] = useState(null);
  const [showLegendModal, setShowLegendModal] = useState(false);
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
      questionHistory: {}, // Track previously asked questions by subject
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

  // Track question history to avoid repeats
  const trackQuestionHistory = (subject, questionId) => {
    const newProgress = {
      ...progress,
      questionHistory: {
        ...(progress.questionHistory || {}),
        [subject]: {
          ...(progress.questionHistory?.[subject] || {}),
          [questionId]: Date.now()
        }
      }
    };
    saveProgress(newProgress);
  };

  // Clean up old question history to prevent storage bloat
  const cleanupQuestionHistory = () => {
    const currentTime = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const cleanedHistory = {};
    
    // Check if questionHistory exists and is an object
    if (!progress.questionHistory || typeof progress.questionHistory !== 'object') {
      return;
    }
    
    Object.keys(progress.questionHistory).forEach(subject => {
      const subjectHistory = progress.questionHistory[subject];
      if (!subjectHistory || typeof subjectHistory !== 'object') {
        return;
      }
      
      const cleanedSubject = {};
      
      Object.keys(subjectHistory).forEach(questionId => {
        const lastAsked = subjectHistory[questionId];
        // Keep questions asked within the last week
        if (lastAsked && currentTime - lastAsked < oneWeek) {
          cleanedSubject[questionId] = lastAsked;
        }
      });
      
      // Only keep subjects that have questions
      if (Object.keys(cleanedSubject).length > 0) {
        cleanedHistory[subject] = cleanedSubject;
      }
    });
    
    if (JSON.stringify(cleanedHistory) !== JSON.stringify(progress.questionHistory)) {
      const newProgress = {
        ...progress,
        questionHistory: cleanedHistory
      };
      saveProgress(newProgress);
    }
  };

  // Get question ID for tracking (create a unique identifier)
  const getQuestionId = (question) => {
    if (question.word) {
      return `${question.word}-${question.question}`;
    }
    return question.question || question.answer || JSON.stringify(question);
  };

  // Enhanced shuffle function that avoids recent questions
  const smartShuffle = (questions, subject, questionCount) => {
    const currentTime = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const oneWeek = 7 * oneDay; // 7 days in milliseconds
    
    // Get question history for this subject with null check
    const subjectHistory = (progress.questionHistory && progress.questionHistory[subject]) || {};
    
    // Separate questions into categories
    const recentQuestions = []; // Asked within last 24 hours
    const oldQuestions = []; // Asked more than 24 hours ago
    const newQuestions = []; // Never asked
    
    questions.forEach((question, index) => {
      const questionId = getQuestionId(question);
      const lastAsked = subjectHistory[questionId];
      
      if (!lastAsked) {
        newQuestions.push({ question, index });
      } else if (currentTime - lastAsked < oneDay) {
        recentQuestions.push({ question, index });
      } else {
        oldQuestions.push({ question, index });
      }
    });
    
    // Prioritize new questions, then old questions, avoid recent ones
    const prioritizedQuestions = [
      ...newQuestions,
      ...oldQuestions,
      ...recentQuestions // Only include recent ones if we don't have enough
    ];
    
    // Shuffle within each category to maintain some randomness
    const shuffleCategory = (category) => {
      const shuffled = [...category];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    const shuffledNew = shuffleCategory(newQuestions);
    const shuffledOld = shuffleCategory(oldQuestions);
    const shuffledRecent = shuffleCategory(recentQuestions);
    
    // Combine with priority: new > old > recent
    const finalQuestions = [
      ...shuffledNew,
      ...shuffledOld,
      ...shuffledRecent
    ];
    
    // Take only the requested number of questions
    return finalQuestions.slice(0, questionCount).map(item => item.question);
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

  // Direct email sending using EmailJS
  const sendDirectEmail = async (emailData) => {
    setIsSendingEmail(true);
    setEmailSent(false);
    
    try {
      // EmailJS configuration - using your actual EmailJS credentials
      const serviceId = 'service_gb588mf'; // Your Gmail service ID
      const templateId = 'template_3rem6dk'; // Your existing EmailJS template
      const publicKey = '26x_rZp9m4ZPVymvg'; // Your EmailJS public key
      
      const templateParams = {
        to_email: shareEmail,
        subject: emailData.subject,
        message: emailData.body,
        from_name: 'Emmy\'s Learning Adventure',
        student_name: 'Emmy',
        subject_line: emailData.subject, // Additional parameter to ensure subject is captured
        email_body: emailData.body // Additional parameter to ensure body is captured
      };
      
      console.log('Sending email with params:', {
        serviceId,
        templateId,
        publicKey,
        templateParams
      });
      
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      if (result.status === 200) {
        setEmailSent(true);
        setTimeout(() => {
          setShowShareModal(false);
          setShareEmail('');
          setShareMessage('');
          setEmailSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message,
        fullError: error
      });
      
      // Check if it's a template error and provide helpful message
      if (error.text && error.text.includes('template ID not found')) {
        alert('Email template not found! Please create a template called "template_emmy_learning" in your EmailJS dashboard. For now, please use Gmail, Outlook, or Yahoo options.');
      } else if (error.text && error.text.includes('Public Key is invalid')) {
        alert('EmailJS Public Key is invalid. Please check your EmailJS dashboard for the correct public key.');
      } else if (error.text && error.text.includes('Service ID')) {
        alert('EmailJS Service ID is invalid. Please check your EmailJS dashboard for the correct service ID.');
      } else {
        alert(`Failed to send email: ${error.text || error.message || 'Unknown error'}. Please try using one of the email service options instead.`);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleProgressEmailShare = (service = 'mailto') => {
    const emailSubject = `📚 Emmy's Learning Progress Update - ${completedSubjects}/${totalSubjects} Subjects Complete!`;
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

${completedSubjects >= 8 ? "I'm almost done with all subjects! 🎓" : completedSubjects >= 5 ? "I'm making great progress! 🌟" : "I'm building my learning foundation! 💪"}

${shareMessage || "I'm so proud of my learning journey! 🎉"}

Keep encouraging my education! 

Love,
Your Student ✨
    `.trim();

    // Handle direct email sending
    if (service === 'direct') {
      sendDirectEmail({ subject: emailSubject, body: emailBody });
      return;
    }

    let shareUrl;
    
    switch (service) {
      case 'gmail':
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'outlook':
        shareUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(shareEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'yahoo':
        shareUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(shareEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'mailto':
      default:
        shareUrl = `mailto:${shareEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
    }
    
    window.open(shareUrl, '_blank');
    setShowShareModal(false);
    setShareEmail('');
    setShareMessage('');
  };

  const handleEmailShare = (service = 'mailto') => {
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

    const questionsAnswered = currentQuestion + 1; // currentQuestion is 0-indexed, so add 1
    const percentage = Math.round((score / (questionsAnswered * 10)) * 100);
    const completionTime = new Date().toLocaleString();
    
    const emailSubject = `🎉 Emmy Completed ${subjectName} Module - ${percentage}% Score!`;
    const emailBody = `
Hi! 

I just completed the ${subjectName} module in Emmy's Learning Adventure! 

📊 My Results:
• Subject: ${subjectName}
• Score: ${score} points
• Percentage: ${percentage}%
• Questions Answered: ${questionsAnswered}
• Correct Answers: ${Math.floor(score / 10)}
• Completed: ${completionTime}

${percentage >= 90 ? "I got almost everything right! 🌟" : percentage >= 70 ? "I did really well! 😊" : "I'm learning and getting better! 💪"}

${shareMessage || "I'm so proud of my progress! 🎉"}

Keep encouraging my learning journey! 

Love,
Your Student ✨
    `.trim();

    // Handle direct email sending
    if (service === 'direct') {
      sendDirectEmail({ subject: emailSubject, body: emailBody });
      return;
    }

    let shareUrl;
    
    switch (service) {
      case 'gmail':
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'outlook':
        shareUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(shareEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'yahoo':
        shareUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(shareEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'mailto':
      default:
        shareUrl = `mailto:${shareEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
    }
    
    window.open(shareUrl, '_blank');
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
      'field-trips': ['Home', 'Field Trips'],
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
      
      // Skip OAuth callback processing - let AuthCallback handle it
      if (hashPath.includes('access_token') || hashPath.includes('error') || hashPath.includes('auth/callback')) {
        return;
      }
      
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
  // Filter spelling words by month
  const getSpellingWordsByMonth = (month) => {
    if (month === 'all') return spellingWords;
    
    const monthRanges = {
      'october': { start: 0, end: 10 },
      'november': { start: 10, end: 20 },
      'december': { start: 20, end: 30 },
      'january': { start: 30, end: 40 },
      'february': { start: 40, end: 50 },
      'march': { start: 50, end: 60 },
      'additional': { start: 60, end: spellingWords.length }
    };
    
    const range = monthRanges[month];
    if (!range) return spellingWords;
    
    return spellingWords.slice(range.start, range.end);
  };

  // Filter phonics questions by difficulty
  const getPhonicsQuestionsByDifficulty = (difficulty) => {
    return phonicsQuestions[difficulty] || phonicsQuestions.medium;
  };

  // Filter math questions by difficulty
  const getMathQuestionsByDifficulty = (difficulty) => {
    return mathQuestions[difficulty] || mathQuestions.medium;
  };

  // Filter reading questions by category
  const getReadingQuestionsByCategory = (category) => {
    if (category === 'all') return readingQuestions;
    
    // For now, return all reading questions since they're not categorized
    // In the future, we could add categories like 'story-elements', 'comprehension', etc.
    return readingQuestions;
  };

  // Calculate total questions for each subject
  const getQuestionCount = (subject) => {
    switch (subject) {
      case 'phonics':
        return phonicsQuestions.easy.length + phonicsQuestions.medium.length + phonicsQuestions.hard.length;
      case 'math':
        return mathQuestions.easy.length + mathQuestions.medium.length + mathQuestions.hard.length;
      case 'reading':
        return readingQuestions.length;
      case 'spelling':
        return spellingWords.length;
      case 'science':
        return scienceQuestions.length;
      case 'art':
        return artQuestions.length;
      case 'geography':
        return geographyQuestions.length;
      case 'history':
        return historyQuestions.length;
      case 'social':
        return socialStudiesQuestions.length;
      case 'skipcounting':
        return skipCountingQuestions.length;
      default:
        return 0;
    }
  };

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
    
    // Scroll to top of page - with delay for game screens on mobile
    const gameScreens = ['phonics', 'math', 'reading', 'science', 'art', 'geography', 'history', 'spelling'];
    if (gameScreens.includes(screen)) {
      // Add small delay for game screens to ensure proper mobile scrolling
      setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);
    } else {
      // Immediate scroll for non-game screens
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // Clean up question history on app start
  useEffect(() => {
    if (progress && progress.questionHistory) {
      cleanupQuestionHistory();
    }
  }, [progress]);

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
    { word: 'then', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '⏰', explanation: 'TH makes the "th" sound like in "then" - put your tongue between your teeth!' },
    { word: 'show', question: 'Does this word have SH or TH?', options: ['SH', 'TH'], correct: 'SH', image: '👁️', explanation: 'SH makes the "sh" sound like in "show" - put your lips together and blow!' },
    { word: 'chair', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🪑', explanation: 'CH makes the "ch" sound like in "chair" - it sounds like a sneeze!' },
    { word: 'duck', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🦆', explanation: 'CK makes the "k" sound at the end of short words like "duck"!' },
      { word: 'ship', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🚢', explanation: 'SH makes the "sh" sound like in "ship" - put your lips together and blow!' },
      { word: 'that', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '👆', explanation: 'TH makes the "th" sound like in "that" - put your tongue between your teeth!' },
      { word: 'shop', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🏪', explanation: 'SH makes the "sh" sound like in "shop" - put your lips together and blow!' },
      { word: 'chip', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍟', explanation: 'CH makes the "ch" sound like in "chip" - it sounds like a sneeze!' },
      { word: 'back', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🔙', explanation: 'CK makes the "k" sound at the end of short words like "back"!' },
      { word: 'fish', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🐟', explanation: 'SH makes the "sh" sound like in "fish" - put your lips together and blow!' },
      { word: 'rich', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '💰', explanation: 'CH makes the "ch" sound like in "rich" - it sounds like a sneeze!' },
      { word: 'wish', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🌟', explanation: 'SH makes the "sh" sound like in "wish" - put your lips together and blow!' },
      { word: 'much', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '📏', explanation: 'CH makes the "ch" sound like in "much" - it sounds like a sneeze!' },
      { word: 'rush', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🏃', explanation: 'SH makes the "sh" sound like in "rush" - put your lips together and blow!' },
      { word: 'bath', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🛁', explanation: 'TH makes the "th" sound like in "bath" - put your tongue between your teeth!' },
      { word: 'lunch', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍽️', explanation: 'CH makes the "ch" sound like in "lunch" - it sounds like a sneeze!' },
      { word: 'brush', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🪥', explanation: 'SH makes the "sh" sound like in "brush" - put your lips together and blow!' },
      { word: 'catch', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '⚾', explanation: 'CH makes the "ch" sound like in "catch" - it sounds like a sneeze!' },
      { word: 'flash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '⚡', explanation: 'SH makes the "sh" sound like in "flash" - put your lips together and blow!' },
      { word: 'match', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🔥', explanation: 'CH makes the "ch" sound like in "match" - it sounds like a sneeze!' },
      { word: 'crash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '💥', explanation: 'SH makes the "sh" sound like in "crash" - put your lips together and blow!' },
      { word: 'patch', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🩹', explanation: 'CH makes the "ch" sound like in "patch" - it sounds like a sneeze!' },
      { word: 'smash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '💥', explanation: 'SH makes the "sh" sound like in "smash" - put your lips together and blow!' },
      { word: 'dish', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🍽️', explanation: 'SH makes the "sh" sound like in "dish" - put your lips together and blow!' },
      { word: 'bench', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🪑', explanation: 'CH makes the "ch" sound like in "bench" - it sounds like a sneeze!' },
      { word: 'fresh', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🌿', explanation: 'SH makes the "sh" sound like in "fresh" - put your lips together and blow!' },
      { word: 'watch', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '⌚', explanation: 'CH makes the "ch" sound like in "watch" - it sounds like a sneeze!' },
      { word: 'trash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🗑️', explanation: 'SH makes the "sh" sound like in "trash" - put your lips together and blow!' },
      { word: 'reach', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🤝', explanation: 'CH makes the "ch" sound like in "reach" - it sounds like a sneeze!' },
      { word: 'splash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '💦', explanation: 'SH makes the "sh" sound like in "splash" - put your lips together and blow!' },
      { word: 'teach', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '👩‍🏫', explanation: 'CH makes the "ch" sound like in "teach" - it sounds like a sneeze!' },
      { word: 'wash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🧼', explanation: 'SH makes the "sh" sound like in "wash" - put your lips together and blow!' },
      { word: 'peach', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍑', explanation: 'CH makes the "ch" sound like in "peach" - it sounds like a sneeze!' },
      { word: 'cash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '💰', explanation: 'SH makes the "sh" sound like in "cash" - put your lips together and blow!' },
      { word: 'beach', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🏖️', explanation: 'CH makes the "ch" sound like in "beach" - it sounds like a sneeze!' },
      { word: 'dash', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '💨', explanation: 'SH makes the "sh" sound like in "dash" - put your lips together and blow!' },
      { word: 'speech', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🗣️', explanation: 'CH makes the "ch" sound like in "speech" - it sounds like a sneeze!' }
    ],
    medium: [
    { word: 'when', question: 'Does this word have WH or TH?', options: ['WH', 'TH'], correct: 'WH', image: '🕐', explanation: 'WH makes the "w" sound like in "when" - it sounds like "w" + "h"!' },
    { word: 'think', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '🧠', explanation: 'TH makes the "th" sound like in "think" - put your tongue between your teeth!' },
    { word: 'phone', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📞', explanation: 'PH makes the "f" sound like in "phone" - PH sounds just like F!' },
    { word: 'whip', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🥊' },
      { word: 'thick', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '📚' },
      { word: 'brush', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🪥' },
      { word: 'cheese', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧀' },
      { word: 'where', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '📍' },
      { word: 'graph', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📊' },
      { word: 'white', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '⚪' },
      { word: 'photo', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📷' },
      { word: 'while', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '⏰' },
      { word: 'elephant', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🐘' },
      { word: 'whale', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🐋' },
      { word: 'alphabet', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🔤' },
      { word: 'wheel', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🎡' },
      { word: 'throw', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🎯' },
      { word: 'phrase', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💬' },
      { word: 'three', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '3️⃣' },
      { word: 'whisper', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🤫' },
      { word: 'phrase', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💬' },
      { word: 'through', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🚪' },
      { word: 'whistle', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔊' },
      { word: 'physics', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '⚗️' },
      { word: 'thunder', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '⛈️' },
      { word: 'shadow', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🌑' },
      { word: 'kitchen', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍳' },
      { word: 'nothing', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🚫' },
      { word: 'shower', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🚿' },
      { word: 'teacher', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '👩‍🏫' },
      { word: 'brother', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '👦' },
      { word: 'fishing', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🎣' },
      { word: 'kitchen', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍳' },
      { word: 'weather', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🌤️' },
      { word: 'washing', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🧺' },
      { word: 'stretch', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🤸' },
      { word: 'gather', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '📦' },
      { word: 'pushing', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '👋' },
      { word: 'kitchen', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍳' }
    ],
    hard: [
      { word: 'photo', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📷' },
      { word: 'which', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '❓' },
      { word: 'black', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '⚫' },
      { word: 'through', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '🚪' },
      { word: 'machine', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '⚙️' },
      { word: 'graph', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📊' },
      { word: 'wheat', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🌾' },
      { word: 'knock', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🚪' },
      { word: 'champion', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🏆' },
      { word: 'sheriff', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '👮' },
      { word: 'physical', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💪' },
      { word: 'whether', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🤔' },
      { word: 'chocolate', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍫' },
      { word: 'sherbet', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🍧' },
      { word: 'philosophy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🤔' },
      { word: 'whisper', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🤫' },
      { word: 'chemistry', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧪' },
      { word: 'shampoo', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🧴' },
      { word: 'phantom', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '👻' },
      { word: 'whistle', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔊' },
      { word: 'challenge', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🎯' },
      { word: 'sheriff', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '👮' },
      { word: 'pharmacy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💊' },
      { word: 'whichever', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔄' },
      { word: 'champion', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🏆' },
      { word: 'sheriff', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '👮' },
      { word: 'pharmacy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💊' },
      { word: 'whichever', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔄' },
      { word: 'chocolate', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🍫' },
      { word: 'sherbet', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🍧' },
      { word: 'philosophy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🤔' },
      { word: 'whisper', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🤫' },
      { word: 'chemistry', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧪' },
      { word: 'shampoo', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🧴' },
      { word: 'phantom', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '👻' },
      { word: 'whistle', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔊' },
      { word: 'challenge', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🎯' },
      { word: 'sheriff', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '👮' },
      { word: 'pharmacy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '💊' },
      { word: 'whichever', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🔄' },
      { word: 'technology', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '💻' },
      { word: 'psychological', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧠' },
      { word: 'microphone', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🎤' },
      { word: 'symphony', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🎼' },
      { word: 'chronological', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '⏰' },
      { word: 'telephone', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📞' },
      { word: 'archaeology', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🏺' },
      { word: 'geography', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🌍' },
      { word: 'psychology', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🧠' },
      { word: 'philosophy', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🤔' },
      { word: 'architect', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🏗️' },
      { word: 'sophisticated', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🎩' },
      { word: 'character', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '👤' },
      { word: 'atmosphere', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '🌫️' }
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
      { question: 'Feed the alligator the bigger number: 100 or 101?', options: ['100', '101'], correct: '101', emoji: '🐊', explanation: '101 is greater than 100!' },
      { question: 'Feed the alligator the bigger number: 93 or 65?', options: ['93', '65'], correct: '93', emoji: '🐊', explanation: '93 is greater than 65!' },
      { question: 'Feed the alligator the bigger number: 56 or 98?', options: ['56', '98'], correct: '98', emoji: '🐊', explanation: '98 is greater than 56!' },
      { question: 'Sarah has 3 apples. She buys 2 more. How many apples does she have?', options: ['4', '5'], correct: '5', emoji: '🍎' },
      { question: 'Tom has 5 cookies. He eats 2. How many cookies are left?', options: ['2', '3'], correct: '3', emoji: '🍪' },
      { question: 'There are 4 birds on a tree. 1 more bird comes. How many birds are there?', options: ['4', '5'], correct: '5', emoji: '🐦' },
      { question: 'Emma has 6 stickers. She gives away 1. How many stickers does she have left?', options: ['4', '5'], correct: '5', emoji: '⭐' },
      { question: 'Santiago ate 6 crackers. Later he ate 12 more. How many crackers did he eat?', options: ['17', '18'], correct: '18', emoji: '🍪', explanation: '6 + 12 = 18 crackers' },
      { question: 'Maria had 4 crayons. Her friend gave her 8 more. How many crayons does she have?', options: ['11', '12'], correct: '12', emoji: '🖍️', explanation: '4 + 8 = 12 crayons' },
      { question: 'Jake found 5 shells at the beach. Then he found 7 more. How many shells did he find?', options: ['11', '12'], correct: '12', emoji: '🐚', explanation: '5 + 7 = 12 shells' },
      { question: 'Lily read 3 books in the morning. In the afternoon she read 9 more. How many books did she read?', options: ['11', '12'], correct: '12', emoji: '📚', explanation: '3 + 9 = 12 books' },
      { question: 'How many sides does a square have?', options: ['3', '4'], correct: '4', emoji: '⬜' },
      { question: 'How many corners does a triangle have?', options: ['3', '4'], correct: '3', emoji: '🔺' },
      { question: 'Which shape has 4 equal sides?', options: ['Triangle', 'Square'], correct: 'Square', emoji: '⬜' },
      { question: 'What is 1 + 4?', options: ['4', '5'], correct: '5', emoji: '➕' },
      { question: 'What is 7 + 1?', options: ['7', '8'], correct: '8', emoji: '➕' },
      { question: 'What is 9 - 2?', options: ['6', '7'], correct: '7', emoji: '➖' },
      { question: 'How many eyes does a person have?', options: ['1', '2'], correct: '2', emoji: '👀' },
      { question: 'What is 2 + 4?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'What is 8 - 1?', options: ['6', '7'], correct: '7', emoji: '➖' },
      { question: 'How many wheels on a tricycle?', options: ['2', '3'], correct: '3', emoji: '🚲' },
      { question: 'What is 0 + 3?', options: ['2', '3'], correct: '3', emoji: '➕' },
      { question: 'What is 6 - 2?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many ears does a person have?', options: ['1', '2'], correct: '2', emoji: '👂' },
      { question: 'What is 4 + 2?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'What is 7 - 3?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many sides does a rectangle have?', options: ['3', '4'], correct: '4', emoji: '📱' },
      { question: 'What is 1 + 6?', options: ['6', '7'], correct: '7', emoji: '➕' },
      { question: 'What is 9 - 1?', options: ['7', '8'], correct: '8', emoji: '➖' },
      { question: 'What is 7 - 3?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many eyes does a person have?', options: ['1', '2'], correct: '2', emoji: '👀' },
      { question: 'What is 4 + 3?', options: ['6', '7'], correct: '7', emoji: '➕' },
      { question: 'What is 9 - 2?', options: ['6', '7'], correct: '7', emoji: '➖' },
      { question: 'How many wheels on a car?', options: ['3', '4'], correct: '4', emoji: '🚗' },
      { question: 'What is 2 + 4?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'What is 8 - 1?', options: ['6', '7'], correct: '7', emoji: '➖' },
      { question: 'How many sides does a rectangle have?', options: ['3', '4'], correct: '4', emoji: '📐' },
      { question: 'What is 5 + 1?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'What is 6 - 2?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many legs does a dog have?', options: ['3', '4'], correct: '4', emoji: '🐕' },
      { question: 'What is 3 + 4?', options: ['6', '7'], correct: '7', emoji: '➕' },
      { question: 'What is 10 - 3?', options: ['6', '7'], correct: '7', emoji: '➖' },
      { question: 'How many corners does a square have?', options: ['3', '4'], correct: '4', emoji: '⬜' },
      { question: 'What is 1 + 6?', options: ['6', '7'], correct: '7', emoji: '➕' },
      { question: 'What is 8 - 4?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many arms does a person have?', options: ['1', '2'], correct: '2', emoji: '👋' },
      { question: 'What is 4 + 2?', options: ['5', '6'], correct: '6', emoji: '➕' },
      { question: 'What is 7 - 1?', options: ['5', '6'], correct: '6', emoji: '➖' },
      { question: 'How many sides does a circle have?', options: ['0', '1'], correct: '0', emoji: '⭕' },
      { question: 'What is 2 + 5?', options: ['6', '7'], correct: '7', emoji: '➕' },
      { question: 'What is 9 - 3?', options: ['5', '6'], correct: '6', emoji: '➖' },
      { question: 'How many wheels on a tricycle?', options: ['2', '3'], correct: '3', emoji: '🚲' },
      { question: 'What is 3 + 1?', options: ['3', '4'], correct: '4', emoji: '➕' },
      { question: 'What is 5 - 1?', options: ['3', '4'], correct: '4', emoji: '➖' },
      { question: 'How many legs does a spider have?', options: ['6', '8'], correct: '8', emoji: '🕷️' },
      { question: 'What is 2 + 1?', options: ['2', '3'], correct: '3', emoji: '➕' },
      { question: 'What is 4 - 1?', options: ['2', '3'], correct: '3', emoji: '➖' },
      { question: 'How many sides does a pentagon have?', options: ['4', '5'], correct: '5', emoji: '⬟' },
      { question: 'What is 1 + 2?', options: ['2', '3'], correct: '3', emoji: '➕' },
      { question: 'What is 6 - 3?', options: ['2', '3'], correct: '3', emoji: '➖' },
      { question: 'How many wheels on a unicycle?', options: ['1', '2'], correct: '1', emoji: '🚲' },
      { question: 'What is 4 + 0?', options: ['3', '4'], correct: '4', emoji: '➕' },
      { question: 'What is 7 - 4?', options: ['2', '3'], correct: '3', emoji: '➖' },
      { question: 'How many corners does a triangle have?', options: ['3', '4'], correct: '3', emoji: '🔺' },
      { question: 'What is 0 + 3?', options: ['2', '3'], correct: '3', emoji: '➕' },
      { question: 'What is 5 - 2?', options: ['2', '3'], correct: '3', emoji: '➖' },
      { question: 'How many wheels on a motorcycle?', options: ['1', '2'], correct: '2', emoji: '🏍️' }
    ],
    medium: [
    { question: 'Which number is GREATER?', options: ['47', '52'], correct: '52', emoji: '🔢' },
    { question: 'How many tens in 45?', options: ['4', '5'], correct: '4', emoji: '🎯' },
    { question: 'What is 5 + 3?', options: ['7', '8'], correct: '8', emoji: '➕' },
    { question: 'Emma collected 7 stickers. Later she collected 8 more. How many stickers does she have?', options: ['14', '15'], correct: '15', emoji: '⭐', explanation: '7 + 8 = 15 stickers' },
    { question: 'Noah had 9 toy cars. His brother gave him 6 more. How many toy cars does he have now?', options: ['14', '15'], correct: '15', emoji: '🚗', explanation: '9 + 6 = 15 toy cars' },
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
      { question: 'What is 3 × 4?', options: ['11', '12'], correct: '12', emoji: '✖️' },
      { question: 'What is 2 × 6?', options: ['11', '12'], correct: '12', emoji: '✖️' },
      { question: 'What is 5 × 3?', options: ['14', '15'], correct: '15', emoji: '✖️' },
      { question: 'What is 4 × 4?', options: ['15', '16'], correct: '16', emoji: '✖️' },
      { question: 'What is 6 ÷ 2?', options: ['2', '3'], correct: '3', emoji: '➗' },
      { question: 'What is 8 ÷ 4?', options: ['1', '2'], correct: '2', emoji: '➗' },
      { question: 'What is 15 ÷ 3?', options: ['4', '5'], correct: '5', emoji: '➗' },
      { question: 'What is 12 ÷ 4?', options: ['2', '3'], correct: '3', emoji: '➗' },
      { question: 'What is 2 × 7?', options: ['13', '14'], correct: '14', emoji: '✖️' },
      { question: 'What is 3 × 5?', options: ['14', '15'], correct: '15', emoji: '✖️' },
      { question: 'What is 4 × 3?', options: ['11', '12'], correct: '12', emoji: '✖️' },
      { question: 'What is 6 ÷ 3?', options: ['1', '2'], correct: '2', emoji: '➗' },
      { question: 'What is 9 ÷ 3?', options: ['2', '3'], correct: '3', emoji: '➗' },
      { question: 'What is 10 ÷ 2?', options: ['4', '5'], correct: '5', emoji: '➗' },
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
      { question: 'Which shape has no corners?', options: ['Circle', 'Triangle'], correct: 'Circle', emoji: '⭕' },
      { question: 'What is 13 + 4?', options: ['16', '17'], correct: '17', emoji: '➕' },
      { question: 'What is 19 - 7?', options: ['11', '12'], correct: '12', emoji: '➖' },
      { question: 'How many tens in 84?', options: ['8', '4'], correct: '8', emoji: '🎯' },
      { question: 'Which is greater: 59 or 95?', options: ['59', '95'], correct: '95', emoji: '🔢' },
      { question: 'What is 7 + 6?', options: ['12', '13'], correct: '13', emoji: '➕' },
      { question: 'What is 21 - 9?', options: ['11', '12'], correct: '12', emoji: '➖' },
      { question: 'How many ones in 46?', options: ['4', '6'], correct: '6', emoji: '🎯' },
      { question: 'Which is smaller: 61 or 16?', options: ['61', '16'], correct: '16', emoji: '🔢' },
      { question: 'What is 8 + 5?', options: ['12', '13'], correct: '13', emoji: '➕' },
      { question: 'What is 16 - 8?', options: ['7', '8'], correct: '8', emoji: '➖' },
      { question: 'How many tens in 73?', options: ['7', '3'], correct: '7', emoji: '🎯' },
      { question: 'Which is greater: 48 or 84?', options: ['48', '84'], correct: '84', emoji: '🔢' },
      { question: 'What is 9 + 7?', options: ['15', '16'], correct: '16', emoji: '➕' },
      { question: 'What is 22 - 6?', options: ['15', '16'], correct: '16', emoji: '➖' },
      { question: 'How many ones in 58?', options: ['5', '8'], correct: '8', emoji: '🎯' },
      { question: 'Which is smaller: 39 or 93?', options: ['39', '93'], correct: '39', emoji: '🔢' },
      { question: 'What is 6 + 8?', options: ['13', '14'], correct: '14', emoji: '➕' },
      { question: 'What is 18 - 5?', options: ['12', '13'], correct: '13', emoji: '➖' },
      { question: 'How many tens in 96?', options: ['9', '6'], correct: '9', emoji: '🎯' },
      { question: 'What is 2 × 3?', options: ['5', '6'], correct: '6', emoji: '✖️' },
      { question: 'What is 4 × 2?', options: ['7', '8'], correct: '8', emoji: '✖️' },
      { question: 'What is 3 × 3?', options: ['8', '9'], correct: '9', emoji: '✖️' },
      { question: 'What is 5 × 2?', options: ['9', '10'], correct: '10', emoji: '✖️' },
      { question: 'What is 2 × 4?', options: ['7', '8'], correct: '8', emoji: '✖️' },
      { question: 'What is 3 × 2?', options: ['5', '6'], correct: '6', emoji: '✖️' },
      { question: 'What is 4 × 3?', options: ['11', '12'], correct: '12', emoji: '✖️' },
      { question: 'What is 5 × 3?', options: ['14', '15'], correct: '15', emoji: '✖️' },
      { question: 'What is 2 × 5?', options: ['9', '10'], correct: '10', emoji: '✖️' },
      { question: 'What is 6 ÷ 2?', options: ['2', '3'], correct: '3', emoji: '➗' },
      { question: 'What is 8 ÷ 2?', options: ['3', '4'], correct: '4', emoji: '➗' },
      { question: 'What is 9 ÷ 3?', options: ['2', '3'], correct: '3', emoji: '➗' },
      { question: 'What is 10 ÷ 2?', options: ['4', '5'], correct: '5', emoji: '➗' },
      { question: 'What is 12 ÷ 3?', options: ['3', '4'], correct: '4', emoji: '➗' },
      { question: 'What is 15 ÷ 3?', options: ['4', '5'], correct: '5', emoji: '➗' }
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
      { question: 'What is 7 × 8?', options: ['55', '56'], correct: '56', emoji: '✖️' },
      { question: 'What is 6 × 9?', options: ['53', '54'], correct: '54', emoji: '✖️' },
      { question: 'What is 8 × 7?', options: ['55', '56'], correct: '56', emoji: '✖️' },
      { question: 'What is 9 × 6?', options: ['53', '54'], correct: '54', emoji: '✖️' },
      { question: 'What is 56 ÷ 7?', options: ['7', '8'], correct: '8', emoji: '➗' },
      { question: 'What is 54 ÷ 6?', options: ['8', '9'], correct: '9', emoji: '➗' },
      { question: 'What is 63 ÷ 9?', options: ['6', '7'], correct: '7', emoji: '➗' },
      { question: 'What is 48 ÷ 8?', options: ['5', '6'], correct: '6', emoji: '➗' },
      { question: 'What is 5 × 12?', options: ['59', '60'], correct: '60', emoji: '✖️' },
      { question: 'What is 4 × 15?', options: ['59', '60'], correct: '60', emoji: '✖️' },
      { question: 'What is 3 × 20?', options: ['59', '60'], correct: '60', emoji: '✖️' },
      { question: 'What is 60 ÷ 5?', options: ['11', '12'], correct: '12', emoji: '➗' },
      { question: 'What is 60 ÷ 4?', options: ['14', '15'], correct: '15', emoji: '➗' },
      { question: 'What is 60 ÷ 3?', options: ['19', '20'], correct: '20', emoji: '➗' },
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
      { question: 'How many sides does a cube have?', options: ['5', '6'], correct: '6', emoji: '🧊' },
      { question: 'What is 89 + 76?', options: ['164', '165'], correct: '165', emoji: '➕' },
      { question: 'What is 156 - 89?', options: ['66', '67'], correct: '67', emoji: '➖' },
      { question: 'Which is greater: 567 or 576?', options: ['567', '576'], correct: '576', emoji: '🔢' },
      { question: 'How many hundreds in 789?', options: ['7', '8'], correct: '7', emoji: '🎯' },
      { question: 'What is 123 + 456?', options: ['578', '579'], correct: '579', emoji: '➕' },
      { question: 'What is 789 - 234?', options: ['554', '555'], correct: '555', emoji: '➖' },
      { question: 'Which is smaller: 456 or 465?', options: ['456', '465'], correct: '456', emoji: '🔢' },
      { question: 'How many tens in 234?', options: ['23', '3'], correct: '23', emoji: '🎯' },
      { question: 'What is 234 + 567?', options: ['800', '801'], correct: '801', emoji: '➕' },
      { question: 'What is 890 - 456?', options: ['433', '434'], correct: '434', emoji: '➖' },
      { question: 'Which is greater: 789 or 798?', options: ['789', '798'], correct: '798', emoji: '🔢' },
      { question: 'How many ones in 567?', options: ['5', '7'], correct: '7', emoji: '🎯' },
      { question: 'What is 345 + 678?', options: ['1022', '1023'], correct: '1023', emoji: '➕' },
      { question: 'What is 1000 - 234?', options: ['765', '766'], correct: '766', emoji: '➖' },
      { question: 'Which is smaller: 1234 or 1243?', options: ['1234', '1243'], correct: '1234', emoji: '🔢' },
      { question: 'How many hundreds in 1234?', options: ['12', '2'], correct: '12', emoji: '🎯' },
      { question: 'What is 567 + 890?', options: ['1456', '1457'], correct: '1457', emoji: '➕' },
      { question: 'What is 2000 - 567?', options: ['1432', '1433'], correct: '1433', emoji: '➖' },
      { question: 'Which is greater: 2345 or 2354?', options: ['2345', '2354'], correct: '2354', emoji: '🔢' },
      { question: 'What is 6 × 7?', options: ['41', '42'], correct: '42', emoji: '✖️' },
      { question: 'What is 8 × 4?', options: ['31', '32'], correct: '32', emoji: '✖️' },
      { question: 'What is 7 × 6?', options: ['41', '42'], correct: '42', emoji: '✖️' },
      { question: 'What is 9 × 5?', options: ['44', '45'], correct: '45', emoji: '✖️' },
      { question: 'What is 6 × 8?', options: ['47', '48'], correct: '48', emoji: '✖️' },
      { question: 'What is 7 × 7?', options: ['48', '49'], correct: '49', emoji: '✖️' },
      { question: 'What is 8 × 6?', options: ['47', '48'], correct: '48', emoji: '✖️' },
      { question: 'What is 9 × 4?', options: ['35', '36'], correct: '36', emoji: '✖️' },
      { question: 'What is 42 ÷ 6?', options: ['6', '7'], correct: '7', emoji: '➗' },
      { question: 'What is 32 ÷ 4?', options: ['7', '8'], correct: '8', emoji: '➗' },
      { question: 'What is 45 ÷ 5?', options: ['8', '9'], correct: '9', emoji: '➗' },
      { question: 'What is 48 ÷ 6?', options: ['7', '8'], correct: '8', emoji: '➗' },
      { question: 'What is 36 ÷ 4?', options: ['8', '9'], correct: '9', emoji: '➗' },
      { question: 'What is 49 ÷ 7?', options: ['6', '7'], correct: '7', emoji: '➗' }
    ]
  };

  const readingQuestions = [
    { question: 'WHO is in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👥', explanation: 'Characters are the people or animals in the story!' },
    { question: 'WHERE does the story happen?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏠', explanation: 'Setting is WHERE and WHEN the story takes place!' },
    { question: 'WHAT is the problem in the story?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '😰', explanation: 'The problem is what goes wrong or what needs to be fixed!' },
    { question: 'HOW is the problem solved?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '✅', explanation: 'The solution is HOW the problem gets fixed!' },
    { question: 'WHEN does the story happen?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '⏰', explanation: 'WHEN is part of the setting - it tells us the time!' },
    { question: 'WHO is the main character?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👤', explanation: 'The main character is the most important person in the story!' },
    { question: 'WHAT happens at the beginning?', answer: 'Beginning', options: ['Beginning', 'Middle', 'End'], emoji: '🌅', explanation: 'The beginning is how the story starts!' },
    { question: 'WHAT happens at the end?', answer: 'End', options: ['Beginning', 'Middle', 'End'], emoji: '🌅', explanation: 'The end is how the story finishes!' },
    { question: 'WHAT happens in the middle?', answer: 'Middle', options: ['Beginning', 'Middle', 'End'], emoji: '🌞', explanation: 'The middle is the main part of the story!' },
    { question: 'WHO helps solve the problem?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🦸', explanation: 'Characters are the people who help fix the problem!' },
    { question: 'WHERE does the character go?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🚶', explanation: 'WHERE tells us about the places in the story!' },
    { question: 'WHY does the character feel sad?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '😢', explanation: 'WHY tells us about the problem or conflict!' },
    { question: 'HOW does the character feel at the end?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '😊', explanation: 'HOW tells us about the solution or resolution!' },
    { question: 'WHAT does the character learn?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🧠', explanation: 'Learning is part of the solution - it\'s how the character grows!' },
    { question: 'WHO is the villain in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👹', explanation: 'The villain is a character who causes problems!' },
    { question: 'WHERE does the adventure take place?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🗺️', explanation: 'WHERE tells us about the places where the adventure happens!' },
    { question: 'WHAT is the main conflict?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '⚔️', explanation: 'Conflict is another word for the problem in the story!' },
    { question: 'HOW does the story end happily?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🎉', explanation: 'HOW tells us about the solution that makes the ending happy!' },
    { question: 'WHO is the hero in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🦸', explanation: 'The hero is a character who solves the problem!' },
    { question: 'WHERE does the character live?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏡', explanation: 'WHERE tells us about the places where the character lives!' },
    { question: 'WHAT makes the character sad?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '😢', explanation: 'WHAT tells us about the problem or conflict that makes the character sad!' },
    { question: 'HOW does the character solve the problem?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '💡', explanation: 'HOW tells us about the solution - the way the character fixes the problem!' },
    { question: 'WHO helps the main character?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🤝', explanation: 'WHO tells us about the characters who help the main character!' },
    { question: 'WHERE does the adventure begin?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🚀', explanation: 'WHERE tells us about the places where the adventure starts!' },
    { question: 'WHAT goes wrong in the story?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '⚠️', explanation: 'WHAT tells us about the problem or conflict in the story!' },
    { question: 'HOW does the character feel better?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '😊', explanation: 'HOW tells us about the solution that makes the character feel better!' },
    { question: 'WHO is the villain in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👹', explanation: 'The villain is a character who causes problems in the story!' },
    { question: 'WHERE does the story take place?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🌍', explanation: 'WHERE tells us about the places where the story happens!' },
    { question: 'WHAT is the main conflict?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '⚔️', explanation: 'Conflict is another word for the problem in the story!' },
    { question: 'HOW does the story resolve?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '✅', explanation: 'HOW tells us about the solution that resolves the story!' },
    { question: 'WHO tells the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '📖', explanation: 'The narrator is a character who tells us the story!' },
    { question: 'WHERE does the climax happen?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🎭', explanation: 'WHERE tells us about the places where the most exciting part happens!' },
    { question: 'WHAT is the turning point?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '🔄', explanation: 'The turning point is a problem that changes everything!' },
    { question: 'HOW does the character grow?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🌱', explanation: 'HOW tells us about the solution that helps the character grow!' },
    { question: 'WHO is the narrator?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🎤', explanation: 'The narrator is a character who tells the story!' },
    { question: 'WHERE does the resolution occur?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏁', explanation: 'WHERE tells us about the places where the story ends!' },
    { question: 'WHAT is the moral of the story?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '💎', explanation: 'The moral is the lesson or solution the story teaches!' },
    { question: 'WHO is the hero in the story?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🦸', explanation: 'The hero is a character who solves the problem!' },
    { question: 'WHERE does the adventure begin?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🚀', explanation: 'WHERE tells us about the places where the adventure starts!' },
    { question: 'WHAT makes the character happy?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '😊', explanation: 'WHAT tells us about the solution that makes the character happy!' },
    { question: 'WHO helps the main character?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🤝', explanation: 'WHO tells us about the characters who help the main character!' },
    { question: 'WHERE does the character live?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏡', explanation: 'WHERE tells us about the places where the character lives!' },
    { question: 'WHAT is the character afraid of?', answer: 'Problem', options: ['Characters', 'Setting', 'Problem'], emoji: '😨', explanation: 'WHAT tells us about the problem or conflict that scares the character!' },
    { question: 'HOW does the character solve the problem?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '💡', explanation: 'HOW tells us about the solution - the way the character fixes the problem!' },
    { question: 'WHO is the character\'s best friend?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👫', explanation: 'WHO tells us about the characters who are friends!' },
    { question: 'WHERE does the character go on vacation?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '✈️', explanation: 'WHERE tells us about the places where the character goes on vacation!' },
    { question: 'WHAT does the character learn?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '📚', explanation: 'Learning is part of the solution - it\'s how the character grows!' },
    { question: 'WHO teaches the character something new?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👨‍🏫', explanation: 'WHO tells us about the characters who teach!' },
    { question: 'WHERE does the character find the treasure?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏴‍☠️', explanation: 'WHERE tells us about the places where the character finds treasure!' },
    { question: 'WHAT is the character\'s favorite food?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🍕', explanation: 'WHAT tells us about the character\'s preferences and personality!' },
    { question: 'HOW does the character feel at the end?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '😄', explanation: 'HOW tells us about the solution and how the character feels!' },
    { question: 'WHO is the character\'s family?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👨‍👩‍👧‍👦', explanation: 'WHO tells us about the characters who are family members!' },
    { question: 'WHERE does the character go to school?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🏫', explanation: 'WHERE tells us about the places where the character goes to school!' },
    { question: 'WHAT is the character\'s hobby?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🎨', explanation: 'WHAT tells us about the character\'s interests and personality!' },
    { question: 'HOW does the character make friends?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🤗', explanation: 'HOW tells us about the solution - the way the character makes friends!' },
    { question: 'WHO is the character\'s pet?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🐕', explanation: 'WHO tells us about the characters who are pets!' },
    { question: 'WHERE does the character play?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🎮', explanation: 'WHERE tells us about the places where the character plays!' },
    { question: 'WHAT is the character\'s dream?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '💭', explanation: 'WHAT tells us about the character\'s hopes and dreams!' },
    { question: 'HOW does the character overcome fear?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '💪', explanation: 'HOW tells us about the solution - the way the character becomes brave!' },
    { question: 'WHO is the character\'s teacher?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👩‍🏫', explanation: 'WHO tells us about the characters who are teachers!' },
    { question: 'WHERE does the character hide?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🕳️', explanation: 'WHERE tells us about the places where the character hides!' },
    { question: 'WHAT is the character\'s secret?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🤐', explanation: 'WHAT tells us about the character\'s secrets and personality!' },
    { question: 'HOW does the character help others?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🤝', explanation: 'HOW tells us about the solution - the way the character helps!' },
    { question: 'WHO is the character\'s enemy?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '👹', explanation: 'WHO tells us about the characters who are enemies!' },
    { question: 'WHERE does the character discover something?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '🔍', explanation: 'WHERE tells us about the places where discoveries happen!' },
    { question: 'WHAT is the character\'s weakness?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '😰', explanation: 'WHAT tells us about the character\'s weaknesses and personality!' },
    { question: 'HOW does the character show courage?', answer: 'Solution', options: ['Characters', 'Setting', 'Solution'], emoji: '🦸', explanation: 'HOW tells us about the solution - the way the character shows bravery!' },
    { question: 'WHO is the character\'s mentor?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '🧙', explanation: 'WHO tells us about the characters who guide and teach!' },
    { question: 'WHERE does the character face danger?', answer: 'Setting', options: ['Characters', 'Setting', 'Problem'], emoji: '⚠️', explanation: 'WHERE tells us about the places where dangerous things happen!' },
    { question: 'WHAT is the character\'s strength?', answer: 'Characters', options: ['Characters', 'Setting', 'Problem'], emoji: '💪', explanation: 'WHAT tells us about the character\'s strengths and abilities!' }
  ];

  // Calendar Events Data (based on Smore newsletters and typical school events)
  const calendarEvents = {
    9: [ // October
      { date: 29, title: 'Science Test', type: 'test', description: 'Science assessment' },
      { date: 31, title: 'Character Book Parade', type: 'event', description: 'Halloween character book parade' },
      { date: 31, title: 'Social Studies Test', type: 'test', description: 'Social studies assessment' },
      { date: 31, title: 'Halloween Spelling Test', type: 'test', description: 'October spelling words test' },
      { date: 31, title: 'Halloween Party', type: 'event', description: 'Class Halloween celebration' }
    ],
    10: [ // November
      { date: 11, title: 'Veterans Day', type: 'holiday', description: 'School closed - Veterans Day' },
      { date: 18, title: 'Field Trip: Children\'s Museum', type: 'event', description: 'Educational field trip to Children\'s Museum' },
      { date: 24, title: 'Thanksgiving Break Starts', type: 'holiday', description: 'Early dismissal for Thanksgiving break' },
      { date: 25, title: 'Thanksgiving Day', type: 'holiday', description: 'School closed - Thanksgiving Day' },
      { date: 26, title: 'Thanksgiving Break', type: 'holiday', description: 'School closed - Thanksgiving break' }
    ],
    11: [ // December
      { date: 20, title: 'Winter Break Starts', type: 'holiday', description: 'Early dismissal for winter break' },
      { date: 21, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 22, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 23, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 24, title: 'Christmas Eve', type: 'holiday', description: 'School closed - Christmas Eve' },
      { date: 25, title: 'Christmas Day', type: 'holiday', description: 'School closed - Christmas Day' },
      { date: 26, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 27, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 28, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 29, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 30, title: 'Winter Break', type: 'holiday', description: 'School closed - Winter break' },
      { date: 31, title: 'New Year\'s Eve', type: 'holiday', description: 'School closed - New Year\'s Eve' }
    ],
    0: [ // January
      { date: 1, title: 'New Year\'s Day', type: 'holiday', description: 'School closed - New Year\'s Day' },
      { date: 2, title: 'School Resumes', type: 'event', description: 'Classes resume after winter break' },
      { date: 15, title: 'Martin Luther King Jr. Day', type: 'holiday', description: 'School closed - MLK Day' }
    ],
    1: [ // February
      { date: 14, title: 'Valentine\'s Day Party', type: 'event', description: 'Class Valentine\'s Day celebration' },
      { date: 19, title: 'Presidents\' Day', type: 'holiday', description: 'School closed - Presidents\' Day' }
    ],
    2: [ // March
      { date: 17, title: 'St. Patrick\'s Day', type: 'event', description: 'Green day celebration' },
      { date: 25, title: 'Spring Break Starts', type: 'holiday', description: 'Early dismissal for spring break' },
      { date: 26, title: 'Spring Break', type: 'holiday', description: 'School closed - Spring break' },
      { date: 27, title: 'Spring Break', type: 'holiday', description: 'School closed - Spring break' },
      { date: 28, title: 'Spring Break', type: 'holiday', description: 'School closed - Spring break' },
      { date: 29, title: 'Spring Break', type: 'holiday', description: 'School closed - Spring break' }
    ],
    3: [ // April
      { date: 1, title: 'School Resumes', type: 'event', description: 'Classes resume after spring break' },
      { date: 22, title: 'Earth Day', type: 'event', description: 'Environmental awareness activities' }
    ],
    4: [ // May
      { date: 5, title: 'Cinco de Mayo', type: 'event', description: 'Cultural celebration' },
      { date: 27, title: 'Memorial Day', type: 'holiday', description: 'School closed - Memorial Day' }
    ],
    5: [ // June
      { date: 14, title: 'Last Day of School', type: 'event', description: 'End of school year celebration' },
      { date: 19, title: 'Juneteenth', type: 'holiday', description: 'School closed - Juneteenth' }
    ]
  };

  const spellingWords = [
    // October Words (Test 10/31)
    { word: 'than', hint: 'compare two things' }, 
    { word: 'think', hint: 'use your brain' },
    { word: 'their', hint: 'belongs to them' },
    { word: 'these', hint: 'close by (plural)' },
    { word: 'when', hint: 'what time?' },
    { word: 'each', hint: 'every single one' },
    { word: 'such', hint: 'emphasize or describe' },
    { word: 'me', hint: 'refers to yourself' },
    { word: 'find', hint: 'look for it' },
    { word: 'see', hint: 'look at with eyes' },
    
    // November Words
    { word: 'come', hint: 'move toward someone' },
    { word: 'some', hint: 'not all, an amount' },
    { word: 'done', hint: 'finished or completed' },
    { word: 'one', hint: 'the number 1' },
    { word: 'none', hint: 'not any, zero' },
    { word: 'gone', hint: 'left or moved away' },
    { word: 'fun', hint: 'enjoyable or entertaining' },
    { word: 'run', hint: 'move quickly on feet' },
    { word: 'sun', hint: 'bright star in sky' },
    { word: 'bun', hint: 'type of bread roll' },
    
    // December Words
    { word: 'red', hint: 'color of fire trucks' },
    { word: 'bed', hint: 'furniture for sleeping' },
    { word: 'fed', hint: 'gave food to (past tense)' },
    { word: 'led', hint: 'showed the way (past tense)' },
    { word: 'wed', hint: 'married (past tense)' },
    { word: 'said', hint: 'spoke words (past tense)' },
    { word: 'paid', hint: 'gave money (past tense)' },
    { word: 'laid', hint: 'put down (past tense)' },
    { word: 'maid', hint: 'woman who cleans' },
    { word: 'afraid', hint: 'feeling scared' },
    
    // January Words
    { word: 'blue', hint: 'color of ocean and sky' },
    { word: 'true', hint: 'real or correct' },
    { word: 'glue', hint: 'sticky substance' },
    { word: 'clue', hint: 'hint for mystery' },
    { word: 'due', hint: 'expected to happen' },
    { word: 'new', hint: 'not old, recent' },
    { word: 'few', hint: 'small number' },
    { word: 'grew', hint: 'got bigger (past tense)' },
    { word: 'flew', hint: 'moved through air (past tense)' },
    { word: 'drew', hint: 'made picture (past tense)' },
    
    // February Words
    { word: 'green', hint: 'color of grass' },
    { word: 'seen', hint: 'looked at (past tense)' },
    { word: 'been', hint: 'existed (past tense)' },
    { word: 'queen', hint: 'female ruler' },
    { word: 'screen', hint: 'flat surface on TV' },
    { word: 'between', hint: 'in middle of two' },
    { word: 'fifteen', hint: 'the number 15' },
    { word: 'sixteen', hint: 'the number 16' },
    { word: 'seventeen', hint: 'the number 17' },
    { word: 'eighteen', hint: 'the number 18' },
    
    // March Words
    { word: 'yellow', hint: 'color of sun' },
    { word: 'fellow', hint: 'a man or person' },
    { word: 'mellow', hint: 'gentle and soft' },
    { word: 'bellow', hint: 'make deep loud sound' },
    { word: 'swallow', hint: 'take down throat' },
    { word: 'follow', hint: 'go after someone' },
    { word: 'hollow', hint: 'empty inside' },
    { word: 'pillow', hint: 'soft cushion for head' },
    { word: 'willow', hint: 'tree with drooping branches' },
    { word: 'billow', hint: 'swell in waves' },
    
    // Additional Common First Grade Words
    { word: 'chair', hint: 'sit on this' },
    { word: 'phone', hint: 'call someone' },
    { word: 'duck', hint: 'quack quack' },
    { word: 'ship', hint: 'sails on water' },
    { word: 'whip', hint: 'crack the whip' },
    { word: 'thick', hint: 'not thin' },
    { word: 'black', hint: 'darkest color' },
    { word: 'white', hint: 'lightest color' },
    { word: 'brown', hint: 'color of tree bark' },
    { word: 'pink', hint: 'light red color' },
    { word: 'purple', hint: 'mix of red and blue' },
    { word: 'orange', hint: 'color of fruit' },
    { word: 'gray', hint: 'mix of black and white' },
    { word: 'house', hint: 'place where you live' },
    { word: 'school', hint: 'place to learn' },
    { word: 'friend', hint: 'person you like' },
    { word: 'happy', hint: 'feeling good' },
    { word: 'sad', hint: 'feeling bad' },
    { word: 'big', hint: 'large size' },
    { word: 'small', hint: 'little size' },
    { word: 'fast', hint: 'quick speed' },
    { word: 'slow', hint: 'not fast' },
    { word: 'hot', hint: 'high temperature' },
    { word: 'cold', hint: 'low temperature' },
    { word: 'good', hint: 'nice or great' },
    { word: 'bad', hint: 'not good' },
    { word: 'yes', hint: 'agreement' },
    { word: 'no', hint: 'disagreement' },
    { word: 'up', hint: 'higher position' },
    { word: 'down', hint: 'lower position' },
    { word: 'in', hint: 'inside something' },
    { word: 'out', hint: 'outside something' },
    { word: 'on', hint: 'top of something' },
    { word: 'off', hint: 'not on something' },
    { word: 'here', hint: 'this place' },
    { word: 'there', hint: 'that place' },
    { word: 'where', hint: 'what place' },
    { word: 'what', hint: 'which thing' },
    { word: 'who', hint: 'which person' },
    { word: 'why', hint: 'for what reason' },
    { word: 'how', hint: 'in what way' },
    { word: 'cat', hint: 'meow animal' },
    { word: 'dog', hint: 'woof animal' },
    { word: 'bird', hint: 'flies in sky' },
    { word: 'fish', hint: 'swims in water' },
    { word: 'tree', hint: 'tall plant' },
    { word: 'flower', hint: 'pretty plant' },
    { word: 'water', hint: 'clear liquid' },
    { word: 'food', hint: 'things we eat' },
    { word: 'book', hint: 'has pages to read' },
    { word: 'toy', hint: 'thing to play with' },
    { word: 'ball', hint: 'round thing to throw' },
    { word: 'car', hint: 'vehicle with wheels' },
    { word: 'bike', hint: 'two-wheeled vehicle' },
    { word: 'game', hint: 'fun activity' },
    { word: 'play', hint: 'have fun' },
    { word: 'work', hint: 'do a job' },
    { word: 'help', hint: 'assist someone' },
    { word: 'give', hint: 'hand something to' },
    { word: 'take', hint: 'get something from' },
    { word: 'make', hint: 'create something' },
    { word: 'break', hint: 'damage something' },
    { word: 'fix', hint: 'repair something' },
    { word: 'open', hint: 'not closed' },
    { word: 'close', hint: 'not open' },
    { word: 'start', hint: 'begin something' },
    { word: 'stop', hint: 'end something' },
    { word: 'go', hint: 'move somewhere' },
    { word: 'come', hint: 'move here' },
    { word: 'get', hint: 'obtain something' },
    { word: 'put', hint: 'place something' },
    { word: 'look', hint: 'use your eyes' },
    { word: 'listen', hint: 'use your ears' },
    { word: 'talk', hint: 'speak words' },
    { word: 'walk', hint: 'move on feet' },
    { word: 'jump', hint: 'leap up' },
    { word: 'run', hint: 'move fast' },
    { word: 'sit', hint: 'rest on bottom' },
    { word: 'stand', hint: 'be on feet' },
    { word: 'sleep', hint: 'rest at night' },
    { word: 'wake', hint: 'stop sleeping' },
    { word: 'eat', hint: 'consume food' },
    { word: 'drink', hint: 'consume liquid' },
    { word: 'wash', hint: 'clean with water' },
    { word: 'brush', hint: 'clean with brush' },
    { word: 'dress', hint: 'put on clothes' },
    { word: 'shoes', hint: 'wear on feet' },
    { word: 'hat', hint: 'wear on head' },
    { word: 'coat', hint: 'wear when cold' },
    { word: 'shirt', hint: 'wear on top' },
    { word: 'pants', hint: 'wear on legs' },
    { word: 'socks', hint: 'wear on feet' },
    { word: 'shorts', hint: 'short pants' },
    { word: 'dress', hint: 'girls clothing' },
    { word: 'skirt', hint: 'girls clothing' },
    { word: 'shoes', hint: 'footwear' },
    { word: 'boots', hint: 'tall shoes' },
    { word: 'sandals', hint: 'open shoes' },
    { word: 'sneakers', hint: 'athletic shoes' },
    { word: 'gloves', hint: 'wear on hands' },
    { word: 'mittens', hint: 'warm gloves' },
    { word: 'scarf', hint: 'wear around neck' },
    { word: 'belt', hint: 'wear around waist' },
    { word: 'watch', hint: 'tells time' },
    { word: 'ring', hint: 'wear on finger' },
    { word: 'necklace', hint: 'wear around neck' },
    { word: 'bracelet', hint: 'wear on wrist' },
    { word: 'earrings', hint: 'wear on ears' },
    { word: 'glasses', hint: 'help you see' },
    { word: 'sunglasses', hint: 'protect eyes from sun' },
    { word: 'umbrella', hint: 'protect from rain' },
    { word: 'bag', hint: 'carry things' },
    { word: 'backpack', hint: 'carry on back' },
    { word: 'purse', hint: 'carry money' },
    { word: 'wallet', hint: 'hold money' },
    { word: 'key', hint: 'opens locks' },
    { word: 'lock', hint: 'keeps things safe' },
    { word: 'door', hint: 'entrance to room' },
    { word: 'window', hint: 'see through wall' },
    { word: 'wall', hint: 'side of room' },
    { word: 'floor', hint: 'walk on this' },
    { word: 'ceiling', hint: 'top of room' },
    { word: 'roof', hint: 'top of house' },
    { word: 'stairs', hint: 'go up and down' },
    { word: 'elevator', hint: 'go up and down' },
    { word: 'escalator', hint: 'moving stairs' },
    { word: 'bridge', hint: 'cross over water' },
    { word: 'road', hint: 'cars drive on' },
    { word: 'street', hint: 'cars drive on' },
    { word: 'sidewalk', hint: 'people walk on' },
    { word: 'park', hint: 'play outside' },
    { word: 'playground', hint: 'play equipment' },
    { word: 'swing', hint: 'play equipment' },
    { word: 'slide', hint: 'play equipment' },
    { word: 'seesaw', hint: 'play equipment' },
    { word: 'jungle gym', hint: 'climb on' },
    { word: 'merry-go-round', hint: 'spin around' },
    { word: 'ferris wheel', hint: 'big wheel' },
    { word: 'roller coaster', hint: 'fast ride' },
    { word: 'bumper cars', hint: 'crash into each other' },
    { word: 'cotton candy', hint: 'sweet treat' },
    { word: 'popcorn', hint: 'movie snack' },
    { word: 'ice cream', hint: 'cold treat' },
    { word: 'cake', hint: 'birthday treat' },
    { word: 'candy', hint: 'sweet treat' },
    { word: 'cookie', hint: 'sweet treat' },
    { word: 'pie', hint: 'sweet treat' },
    { word: 'pizza', hint: 'cheese and toppings' },
    { word: 'hamburger', hint: 'meat sandwich' },
    { word: 'hot dog', hint: 'sausage sandwich' },
    { word: 'sandwich', hint: 'bread with filling' },
    { word: 'salad', hint: 'vegetables mixed' },
    { word: 'soup', hint: 'liquid food' },
    { word: 'cereal', hint: 'breakfast food' },
    { word: 'pancakes', hint: 'breakfast food' },
    { word: 'waffles', hint: 'breakfast food' },
    { word: 'eggs', hint: 'breakfast food' },
    { word: 'bacon', hint: 'breakfast meat' },
    { word: 'toast', hint: 'toasted bread' },
    { word: 'juice', hint: 'fruit drink' },
    { word: 'milk', hint: 'white drink' },
    { word: 'water', hint: 'clear drink' },
    { word: 'soda', hint: 'fizzy drink' },
    { word: 'tea', hint: 'hot drink' },
    { word: 'coffee', hint: 'hot drink' },
    { word: 'hot chocolate', hint: 'hot sweet drink' },
    { word: 'lemonade', hint: 'sour drink' },
    { word: 'apple', hint: 'red fruit' },
    { word: 'banana', hint: 'yellow fruit' },
    { word: 'orange', hint: 'orange fruit' },
    { word: 'grape', hint: 'small fruit' },
    { word: 'strawberry', hint: 'red berry' },
    { word: 'blueberry', hint: 'blue berry' },
    { word: 'cherry', hint: 'red fruit' },
    { word: 'peach', hint: 'fuzzy fruit' },
    { word: 'pear', hint: 'green fruit' },
    { word: 'plum', hint: 'purple fruit' },
    { word: 'watermelon', hint: 'big fruit' },
    { word: 'pineapple', hint: 'spiky fruit' },
    { word: 'coconut', hint: 'hairy fruit' },
    { word: 'carrot', hint: 'orange vegetable' },
    { word: 'broccoli', hint: 'green vegetable' },
    { word: 'lettuce', hint: 'green leaves' },
    { word: 'tomato', hint: 'red vegetable' },
    { word: 'potato', hint: 'brown vegetable' },
    { word: 'onion', hint: 'makes you cry' },
    { word: 'corn', hint: 'yellow vegetable' },
    { word: 'peas', hint: 'green vegetables' },
    { word: 'beans', hint: 'green vegetables' },
    { word: 'cucumber', hint: 'green vegetable' },
    { word: 'pepper', hint: 'colorful vegetable' },
    { word: 'mushroom', hint: 'fungus vegetable' },
    { word: 'spinach', hint: 'green leaves' },
    { word: 'cabbage', hint: 'round vegetable' },
    { word: 'cauliflower', hint: 'white vegetable' },
    { word: 'asparagus', hint: 'green stalks' },
    { word: 'celery', hint: 'green stalks' },
    { word: 'radish', hint: 'red vegetable' },
    { word: 'beet', hint: 'red vegetable' },
    { word: 'turnip', hint: 'white vegetable' },
    { word: 'squash', hint: 'orange vegetable' },
    { word: 'pumpkin', hint: 'orange vegetable' },
    { word: 'zucchini', hint: 'green vegetable' },
    { word: 'eggplant', hint: 'purple vegetable' },
    { word: 'artichoke', hint: 'green vegetable' },
    { word: 'avocado', hint: 'green fruit' },
    { word: 'olive', hint: 'small fruit' },
    { word: 'fig', hint: 'sweet fruit' },
    { word: 'date', hint: 'sweet fruit' },
    { word: 'raisin', hint: 'dried grape' },
    { word: 'prune', hint: 'dried plum' },
    { word: 'apricot', hint: 'orange fruit' },
    { word: 'kiwi', hint: 'fuzzy fruit' },
    { word: 'mango', hint: 'tropical fruit' },
    { word: 'papaya', hint: 'tropical fruit' },
    { word: 'passion fruit', hint: 'tropical fruit' },
    { word: 'dragon fruit', hint: 'tropical fruit' },
    { word: 'star fruit', hint: 'tropical fruit' },
    { word: 'guava', hint: 'tropical fruit' },
    { word: 'lychee', hint: 'tropical fruit' },
    { word: 'rambutan', hint: 'tropical fruit' },
    { word: 'durian', hint: 'tropical fruit' },
    { word: 'jackfruit', hint: 'tropical fruit' },
    { word: 'breadfruit', hint: 'tropical fruit' },
    { word: 'plantain', hint: 'cooking banana' }
  ];

  const scienceQuestions = [
    { question: 'A system is made of many...', options: ['Parts', 'Colors'], correct: 'Parts', emoji: '🔧', explanation: 'Systems are made of parts that work together!' },
    { question: 'A whole object is made of organized...', options: ['Parts', 'Water'], correct: 'Parts', emoji: '⚙️', explanation: 'All parts work together as a system!' },
    { question: 'What do plants need to grow?', options: ['Sunlight', 'Darkness'], correct: 'Sunlight', emoji: '☀️', explanation: 'Plants need sunlight to make their own food!' },
    { question: 'What do animals need to survive?', options: ['Food', 'Nothing'], correct: 'Food', emoji: '🍎', explanation: 'All animals need food to stay alive!' },
    { question: 'What happens to water when it gets cold?', options: ['It freezes', 'It disappears'], correct: 'It freezes', emoji: '❄️', explanation: 'Water turns to ice when it gets very cold!' },
    { question: 'What do we call the air around Earth?', options: ['Atmosphere', 'Space'], correct: 'Atmosphere', emoji: '🌍', explanation: 'The atmosphere is the air that surrounds our planet!' },
    { question: 'What do we call water falling from clouds?', options: ['Rain', 'Snow'], correct: 'Rain', emoji: '🌧️', explanation: 'Rain is water that falls from clouds!' },
    { question: 'What do plants need from the soil?', options: ['Water', 'Rocks'], correct: 'Water', emoji: '💧', explanation: 'Plants need water from the soil to grow!' },
    { question: 'What do we call baby plants?', options: ['Seeds', 'Flowers'], correct: 'Seeds', emoji: '🌱', explanation: 'Seeds grow into baby plants!' },
    { question: 'What do we call the hard covering on a tree?', options: ['Bark', 'Leaves'], correct: 'Bark', emoji: '🌳', explanation: 'Bark is the hard covering that protects trees!' },
    { question: 'What do we call the green parts of plants?', options: ['Leaves', 'Roots'], correct: 'Leaves', emoji: '🍃', explanation: 'Leaves are the green parts that make food for plants!' },
    { question: 'What do we call animals that eat plants?', options: ['Herbivores', 'Carnivores'], correct: 'Herbivores', emoji: '🐰', explanation: 'Herbivores are animals that eat plants!' },
    { question: 'What do we call animals that eat meat?', options: ['Carnivores', 'Herbivores'], correct: 'Carnivores', emoji: '🦁', explanation: 'Carnivores are animals that eat meat!' },
    { question: 'What do we call the hard outer covering of some animals?', options: ['Shell', 'Fur'], correct: 'Shell', emoji: '🐚', explanation: 'Some animals have hard shells to protect them!' },
    { question: 'What do we call the white frozen water that falls from the sky?', options: ['Snow', 'Rain'], correct: 'Snow', emoji: '❄️', explanation: 'Snow is frozen water that falls from clouds!' },
    { question: 'What do we call the big ball of fire in the sky?', options: ['Sun', 'Moon'], correct: 'Sun', emoji: '☀️', explanation: 'The Sun is a big ball of fire that gives us light and heat!' },
    { question: 'What do we call the white light in the sky at night?', options: ['Moon', 'Star'], correct: 'Moon', emoji: '🌙', explanation: 'The Moon is the white light we see in the sky at night!' },
    { question: 'What do we call the tiny lights in the sky at night?', options: ['Stars', 'Clouds'], correct: 'Stars', emoji: '⭐', explanation: 'Stars are tiny lights we see in the sky at night!' },
    { question: 'What do we call the process of plants making their own food?', options: ['Photosynthesis', 'Respiration'], correct: 'Photosynthesis', emoji: '🌱', explanation: 'Photosynthesis is how plants make their own food using sunlight!' },
    { question: 'What do we call the hard outer covering of an egg?', options: ['Shell', 'Skin'], correct: 'Shell', emoji: '🥚', explanation: 'The shell is the hard outer covering that protects the egg!' },
    { question: 'What do we call the part of a plant that grows underground?', options: ['Roots', 'Leaves'], correct: 'Roots', emoji: '🌿', explanation: 'Roots grow underground and help plants get water and nutrients!' },
    { question: 'What do we call the process of water turning into vapor?', options: ['Evaporation', 'Condensation'], correct: 'Evaporation', emoji: '💨', explanation: 'Evaporation is when water turns into invisible water vapor!' },
    { question: 'What do we call the process of water vapor turning back into water?', options: ['Condensation', 'Evaporation'], correct: 'Condensation', emoji: '💧', explanation: 'Condensation is when water vapor turns back into liquid water!' },
    { question: 'What do we call the hard outer covering of a tree trunk?', options: ['Bark', 'Skin'], correct: 'Bark', emoji: '🌳', explanation: 'Bark is the hard outer covering that protects the tree trunk!' },
    { question: 'What do we call the green substance in plants that helps them make food?', options: ['Chlorophyll', 'Water'], correct: 'Chlorophyll', emoji: '🟢', explanation: 'Chlorophyll is the green substance that helps plants make food from sunlight!' },
    { question: 'What do we call the process of a caterpillar turning into a butterfly?', options: ['Metamorphosis', 'Growth'], correct: 'Metamorphosis', emoji: '🦋', explanation: 'Metamorphosis is the amazing process of a caterpillar becoming a butterfly!' },
    { question: 'What do we call the hard outer covering of a seed?', options: ['Seed coat', 'Shell'], correct: 'Seed coat', emoji: '🌰', explanation: 'The seed coat is the hard outer covering that protects the seed!' },
    { question: 'What do we call the process of a seed growing into a plant?', options: ['Germination', 'Growth'], correct: 'Germination', emoji: '🌱', explanation: 'Germination is when a seed starts to grow into a new plant!' },
    { question: 'What do we call the process of animals sleeping through winter?', options: ['Hibernation', 'Migration'], correct: 'Hibernation', emoji: '🐻', explanation: 'Hibernation is when animals sleep through the cold winter months!' },
    { question: 'What do we call the process of animals moving to warmer places in winter?', options: ['Migration', 'Hibernation'], correct: 'Migration', emoji: '🦅', explanation: 'Migration is when animals travel to warmer places for the winter!' },
    { question: 'What do we call the process of water moving through a plant?', options: ['Transpiration', 'Photosynthesis'], correct: 'Transpiration', emoji: '💧', explanation: 'Transpiration is how water moves through a plant from roots to leaves!' },
    { question: 'What do we call the process of a plant responding to light?', options: ['Phototropism', 'Gravitropism'], correct: 'Phototropism', emoji: '☀️', explanation: 'Phototropism is how plants grow toward light!' },
    { question: 'What do we call the process of a plant responding to gravity?', options: ['Gravitropism', 'Phototropism'], correct: 'Gravitropism', emoji: '⬇️', explanation: 'Gravitropism is how plant roots grow down toward gravity!' },
    { question: 'What do we call the process of animals changing color to match their surroundings?', options: ['Camouflage', 'Migration'], correct: 'Camouflage', emoji: '🦎', explanation: 'Camouflage helps animals hide by changing color to match their environment!' },
    { question: 'What do we call the process of animals making copies of themselves?', options: ['Reproduction', 'Growth'], correct: 'Reproduction', emoji: '👶', explanation: 'Reproduction is how animals make babies or copies of themselves!' },
    { question: 'What do we call the process of animals finding and eating food?', options: ['Foraging', 'Hunting'], correct: 'Foraging', emoji: '🔍', explanation: 'Foraging is how animals search for and find food in nature!' },
    { question: 'What do we call the process of animals building homes?', options: ['Nesting', 'Hunting'], correct: 'Nesting', emoji: '🏠', explanation: 'Nesting is how animals build homes or nests for their families!' },
    { question: 'What do we call the process of water moving in a cycle?', options: ['Water cycle', 'Rain cycle'], correct: 'Water cycle', emoji: '🌊', explanation: 'The water cycle is how water moves from oceans to clouds to rain and back!' },
    { question: 'What do we call the process of a plant making seeds?', options: ['Pollination', 'Germination'], correct: 'Pollination', emoji: '🌸', explanation: 'Pollination is how plants make seeds with help from bees and other insects!' },
    { question: 'What do we call the process of a plant growing toward the sun?', options: ['Phototropism', 'Gravitropism'], correct: 'Phototropism', emoji: '☀️', explanation: 'Phototropism is how plants grow toward sunlight to get energy!' },
    { question: 'What do we call the process of animals changing with the seasons?', options: ['Adaptation', 'Migration'], correct: 'Adaptation', emoji: '🦌', explanation: 'Adaptation is how animals change their behavior or appearance to survive different seasons!' },
    { question: 'What do we call the process of a plant making its own food?', options: ['Photosynthesis', 'Respiration'], correct: 'Photosynthesis', emoji: '🌱', explanation: 'Photosynthesis is how plants use sunlight, water, and air to make their own food!' },
    { question: 'What do we call the process of water turning into ice?', options: ['Freezing', 'Melting'], correct: 'Freezing', emoji: '❄️', explanation: 'Freezing is when water gets so cold it turns into ice!' },
    { question: 'What do we call the process of ice turning into water?', options: ['Melting', 'Freezing'], correct: 'Melting', emoji: '💧', explanation: 'Melting is when ice gets warm and turns back into water!' },
    { question: 'What do we call the process of a seed growing into a plant?', options: ['Germination', 'Pollination'], correct: 'Germination', emoji: '🌱', explanation: 'Germination is when a seed starts to grow and becomes a new plant!' },
    { question: 'What do we call the process of animals sleeping through winter?', options: ['Hibernation', 'Migration'], correct: 'Hibernation', emoji: '🐻', explanation: 'Hibernation is when animals sleep through the cold winter months to save energy!' },
    { question: 'What do we call the process of animals moving to find food?', options: ['Migration', 'Hibernation'], correct: 'Migration', emoji: '🦅', explanation: 'Migration is when animals travel long distances to find food or warmer weather!' },
    { question: 'What do we call the process of water moving through a plant?', options: ['Transpiration', 'Photosynthesis'], correct: 'Transpiration', emoji: '💧', explanation: 'Transpiration is how water moves through a plant from roots to leaves!' },
    { question: 'What do we call the process of a plant responding to gravity?', options: ['Gravitropism', 'Phototropism'], correct: 'Gravitropism', emoji: '⬇️', explanation: 'Gravitropism is how plant roots grow down toward gravity!' },
    { question: 'What do we call the process of animals changing color to hide?', options: ['Camouflage', 'Migration'], correct: 'Camouflage', emoji: '🦎', explanation: 'Camouflage helps animals hide by changing color to match their surroundings!' },
    { question: 'What do we call the process of animals making babies?', options: ['Reproduction', 'Growth'], correct: 'Reproduction', emoji: '👶', explanation: 'Reproduction is how animals make babies to continue their species!' },
    { question: 'What do we call the process of animals searching for food?', options: ['Foraging', 'Hunting'], correct: 'Foraging', emoji: '🔍', explanation: 'Foraging is how animals search for and find food in nature!' },
    { question: 'What do we call the process of animals building homes?', options: ['Nesting', 'Hunting'], correct: 'Nesting', emoji: '🏠', explanation: 'Nesting is how animals build homes or nests for their families!' },
    { question: 'What do we call the process of water turning into vapor?', options: ['Evaporation', 'Condensation'], correct: 'Evaporation', emoji: '💨', explanation: 'Evaporation is when water gets warm and turns into invisible water vapor!' },
    { question: 'What do we call the process of water vapor turning into clouds?', options: ['Condensation', 'Evaporation'], correct: 'Condensation', emoji: '☁️', explanation: 'Condensation is when water vapor cools down and turns into clouds!' },
    { question: 'What do we call the process of a caterpillar becoming a butterfly?', options: ['Metamorphosis', 'Growth'], correct: 'Metamorphosis', emoji: '🦋', explanation: 'Metamorphosis is the amazing process of a caterpillar changing into a butterfly!' }
  ];

  // Social Studies Map Skills (Week 11 Test - October 31)
  const socialStudiesQuestions = [
    { question: 'What is the symbol on a map that shows directions like North, South, East, and West?', options: ['Compass Rose', 'Map Key'], correct: 'Compass Rose', emoji: '🧭', explanation: 'A compass rose shows directions on a map!' },
    { question: 'Which direction is missing from a compass showing North, South, and West?', options: ['East', 'North'], correct: 'East', emoji: '➡️', explanation: 'East is the missing direction! (North, South, EAST, West)' },
    { question: 'What is the symbol on a map that explains what different symbols mean?', options: ['Map Key', 'Compass Rose'], correct: 'Map Key', emoji: '🗝️', explanation: 'The map key (or legend) tells you what the symbols on the map mean!' },
    { question: 'Which direction would you go to get from the United States to Canada?', options: ['North', 'South'], correct: 'North', emoji: '⬆️', explanation: 'Canada is north of the United States!' },
    { question: 'Which direction would you go to get from the United States to Mexico?', options: ['South', 'North'], correct: 'South', emoji: '⬇️', explanation: 'Mexico is south of the United States!' },
    { question: 'What country do you live in?', options: ['United States of America', 'Mexico'], correct: 'United States of America', emoji: '🇺🇸', explanation: 'We live in the United States of America!' },
    { question: 'What state do you live in?', options: ['Texas', 'Florida'], correct: 'Texas', emoji: '🤠', explanation: 'We live in Texas!' },
    { question: 'Which direction points up on a compass?', options: ['North', 'South'], correct: 'North', emoji: '⬆️', explanation: 'North points up on a compass!' },
    { question: 'Which direction points down on a compass?', options: ['South', 'North'], correct: 'South', emoji: '⬇️', explanation: 'South points down on a compass!' },
    { question: 'Which direction points right on a compass?', options: ['East', 'West'], correct: 'East', emoji: '➡️', explanation: 'East points to the right on a compass!' },
    { question: 'Which direction points left on a compass?', options: ['West', 'East'], correct: 'West', emoji: '⬅️', explanation: 'West points to the left on a compass!' },
    { question: 'Which word means "up" on a compass?', options: ['North', 'South'], correct: 'North', emoji: '⬆️', explanation: 'North means up on a compass!' },
    { question: 'Which word means "down" on a compass?', options: ['South', 'North'], correct: 'South', emoji: '⬇️', explanation: 'South means down on a compass!' },
    { question: 'Which word means "right" on a compass?', options: ['East', 'West'], correct: 'East', emoji: '➡️', explanation: 'East means right on a compass!' },
    { question: 'Which word means "left" on a compass?', options: ['West', 'East'], correct: 'West', emoji: '⬅️', explanation: 'West means left on a compass!' },
    { question: 'If you are going "up" on a map, which direction are you going?', options: ['North', 'South'], correct: 'North', emoji: '⬆️', explanation: 'Going up on a map means you are going North!' },
    { question: 'If you are going "down" on a map, which direction are you going?', options: ['South', 'North'], correct: 'South', emoji: '⬇️', explanation: 'Going down on a map means you are going South!' },
    { question: 'Can you name the four main directions on a compass?', options: ['North, South, East, West', 'Up, Down, Left, Right'], correct: 'North, South, East, West', emoji: '🧭', explanation: 'The four main directions are North, South, East, and West!' },
    { question: 'What do we call a picture of the Earth showing countries and places?', options: ['A Map', 'A Drawing'], correct: 'A Map', emoji: '🗺️', explanation: 'A map is a picture showing places on Earth!' },
    { question: 'Being a good citizen means being...', options: ['Respectful', 'Rude'], correct: 'Respectful', emoji: '🤝', explanation: 'Good citizens treat everyone with respect!' },
    { question: 'Benjamin Franklin was a good citizen who...', options: ['Helped his community', 'Stayed home'], correct: 'Helped his community', emoji: '👨', explanation: 'He helped America and his community!' },
    { question: 'What should you do if you see someone being hurt?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens help others who need it!' },
    { question: 'What should you do with trash?', options: ['Throw it away', 'Leave it on the ground'], correct: 'Throw it away', emoji: '🗑️', explanation: 'Keep our community clean by throwing away trash!' },
    { question: 'What should you do when someone is talking?', options: ['Listen', 'Interrupt'], correct: 'Listen', emoji: '👂', explanation: 'Good citizens listen when others are speaking!' },
    { question: 'What should you do if you make a mistake?', options: ['Say sorry', 'Blame others'], correct: 'Say sorry', emoji: '😔', explanation: 'Good citizens take responsibility for their actions!' },
    { question: 'What should you do if you see someone alone?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '🤗', explanation: 'Good citizens make sure everyone feels included!' },
    { question: 'What should you do if you see someone drop something?', options: ['Pick it up', 'Walk away'], correct: 'Pick it up', emoji: '🤲', explanation: 'Good citizens help others by picking up dropped items!' },
    { question: 'What should you do if someone is crying?', options: ['Comfort them', 'Laugh at them'], correct: 'Comfort them', emoji: '🤗', explanation: 'Good citizens show kindness to those who are sad!' },
    { question: 'What should you do if you see someone struggling?', options: ['Offer help', 'Ignore them'], correct: 'Offer help', emoji: '🆘', explanation: 'Good citizens offer help to those who need it!' },
    { question: 'What should you do if you break something?', options: ['Tell the truth', 'Hide it'], correct: 'Tell the truth', emoji: '💬', explanation: 'Good citizens are honest about their mistakes!' },
    { question: 'What should you do if you see someone being bullied?', options: ['Stand up for them', 'Join in'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens protect others from being hurt!' },
    { question: 'What should you do if you find money?', options: ['Turn it in', 'Keep it'], correct: 'Turn it in', emoji: '💰', explanation: 'Good citizens return lost items to their owners!' },
    { question: 'What should you do if you see someone fall down?', options: ['Help them up', 'Point and laugh'], correct: 'Help them up', emoji: '🤝', explanation: 'Good citizens help others when they fall down!' },
    { question: 'What should you do if you see someone being left out?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens stand up for what is right!' },
    { question: 'What should you do if you see someone being mean?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being left out?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being bullied?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Join in'], correct: 'Help them', emoji: '🆘', explanation: 'Good citizens protect others from being hurt or bullied!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Speak up', 'Stay quiet'], correct: 'Speak up', emoji: '🗣️', explanation: 'Good citizens speak up when they see unfair treatment!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Be kind to them', 'Be mean back'], correct: 'Be kind to them', emoji: '💝', explanation: 'Good citizens show kindness even to those who are mean!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Help them', 'Ignore them'], correct: 'Help them', emoji: '🤝', explanation: 'Good citizens help others who need assistance!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Stand up for them', 'Ignore them'], correct: 'Stand up for them', emoji: '🛡️', explanation: 'Good citizens stand up for what is right and fair!' },
    { question: 'What should you do if you see someone being treated unfairly?', options: ['Include them', 'Ignore them'], correct: 'Include them', emoji: '👥', explanation: 'Good citizens make sure everyone feels welcome and included!' }
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
    { question: 'Count by 10s: 70, 80, 90, __', options: ['100', '95'], correct: '100', emoji: '🔟' },
    { question: 'Count by 2s: 22, 24, 26, __', options: ['28', '27'], correct: '28', emoji: '➕' },
    { question: 'Count by 5s: 50, 55, 60, __', options: ['65', '62'], correct: '65', emoji: '✋' },
    { question: 'Count by 10s: 100, 110, 120, __', options: ['130', '125'], correct: '130', emoji: '🔟' },
    { question: 'Count by 2s: 30, 32, 34, __', options: ['36', '35'], correct: '36', emoji: '➕' },
    { question: 'Count by 5s: 65, 70, 75, __', options: ['80', '78'], correct: '80', emoji: '✋' },
    { question: 'Count by 10s: 130, 140, 150, __', options: ['160', '155'], correct: '160', emoji: '🔟' },
    { question: 'Count by 2s: 38, 40, 42, __', options: ['44', '43'], correct: '44', emoji: '➕' },
    { question: 'Count by 5s: 80, 85, 90, __', options: ['95', '92'], correct: '95', emoji: '✋' },
    { question: 'Count by 10s: 160, 170, 180, __', options: ['190', '185'], correct: '190', emoji: '🔟' }
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
    { question: 'What do we call a picture of nature?', options: ['Landscape', 'Portrait'], correct: 'Landscape', emoji: '🏞️', explanation: 'A landscape is a picture of nature like mountains, trees, or fields!' },
    { question: 'What do we call the colors that are opposite on the color wheel?', options: ['Complementary', 'Primary'], correct: 'Complementary', emoji: '🌈', explanation: 'Complementary colors are opposite each other on the color wheel!' },
    { question: 'What do we call a picture made with dots?', options: ['Pointillism', 'Abstract'], correct: 'Pointillism', emoji: '🔵', explanation: 'Pointillism is a technique using small dots to create pictures!' },
    { question: 'What do we call a picture that doesn\'t look real?', options: ['Abstract', 'Realistic'], correct: 'Abstract', emoji: '🎭', explanation: 'Abstract art doesn\'t look like real things!' },
    { question: 'What do we call a picture that looks very real?', options: ['Realistic', 'Abstract'], correct: 'Realistic', emoji: '🖼️', explanation: 'Realistic art looks very much like real things!' },
    { question: 'What do we call the space around objects in art?', options: ['Negative space', 'Positive space'], correct: 'Negative space', emoji: '🌌', explanation: 'Negative space is the empty space around objects!' },
    { question: 'What do we call the main objects in a picture?', options: ['Positive space', 'Negative space'], correct: 'Positive space', emoji: '🎯', explanation: 'Positive space is the main objects in a picture!' },
    { question: 'What do we call the way lines go in art?', options: ['Direction', 'Color'], correct: 'Direction', emoji: '➡️', explanation: 'Direction is the way lines point in art!' },
    { question: 'What do we call the lightness or darkness of a color?', options: ['Value', 'Hue'], correct: 'Value', emoji: '⚫', explanation: 'Value is how light or dark a color is!' },
    { question: 'What do we call the actual color itself?', options: ['Hue', 'Value'], correct: 'Hue', emoji: '🎨', explanation: 'Hue is the actual color like red, blue, or green!' },
    { question: 'What do we call the way something feels when you touch it?', options: ['Texture', 'Shape'], correct: 'Texture', emoji: '🤲', explanation: 'Texture is how something feels when you touch it!' },
    { question: 'What do we call a picture made with paint?', options: ['Painting', 'Drawing'], correct: 'Painting', emoji: '🎨', explanation: 'A painting is made with paint and brushes!' },
    { question: 'What do we call a picture made with pencils?', options: ['Drawing', 'Painting'], correct: 'Drawing', emoji: '✏️', explanation: 'A drawing is made with pencils, crayons, or markers!' },
    { question: 'What do we call a picture made with clay?', options: ['Sculpture', 'Painting'], correct: 'Sculpture', emoji: '🏺', explanation: 'A sculpture is a 3D artwork made with clay or other materials!' },
    { question: 'What do we call the colors that are next to each other on the color wheel?', options: ['Analogous', 'Complementary'], correct: 'Analogous', emoji: '🌈', explanation: 'Analogous colors are next to each other on the color wheel!' },
    { question: 'What do we call a picture that shows movement?', options: ['Dynamic', 'Static'], correct: 'Dynamic', emoji: '💫', explanation: 'Dynamic art shows movement and energy!' },
    { question: 'What do we call a picture that shows calmness?', options: ['Static', 'Dynamic'], correct: 'Static', emoji: '😌', explanation: 'Static art shows calmness and stillness!' },
    { question: 'What do we call the way light and dark areas are used in art?', options: ['Chiaroscuro', 'Color'], correct: 'Chiaroscuro', emoji: '🌓', explanation: 'Chiaroscuro is the use of light and dark in art!' },
    { question: 'What do we call a picture made with small pieces of colored material?', options: ['Mosaic', 'Collage'], correct: 'Mosaic', emoji: '🧩', explanation: 'A mosaic is made with small pieces of colored material!' },
    { question: 'What do we call a picture made with cut-out pieces of paper?', options: ['Collage', 'Mosaic'], correct: 'Collage', emoji: '✂️', explanation: 'A collage is made with cut-out pieces of paper!' },
    { question: 'What do we call the way lines create patterns in art?', options: ['Rhythm', 'Balance'], correct: 'Rhythm', emoji: '🎵', explanation: 'Rhythm in art is created by repeating lines and patterns!' },
    { question: 'What do we call the way colors are arranged in art?', options: ['Harmony', 'Contrast'], correct: 'Harmony', emoji: '🎼', explanation: 'Harmony is when colors work well together in art!' },
    { question: 'What do we call the way shapes are balanced in art?', options: ['Balance', 'Rhythm'], correct: 'Balance', emoji: '⚖️', explanation: 'Balance is how shapes are arranged to create stability in art!' },
    { question: 'What do we call the way colors create excitement in art?', options: ['Contrast', 'Harmony'], correct: 'Contrast', emoji: '⚡', explanation: 'Contrast is when colors create excitement and energy!' },
    { question: 'What do we call the way lines create movement in art?', options: ['Direction', 'Texture'], correct: 'Direction', emoji: '➡️', explanation: 'Direction is how lines guide the eye through art!' },
    { question: 'What do we call the way shapes create depth in art?', options: ['Perspective', 'Proportion'], correct: 'Perspective', emoji: '🔍', explanation: 'Perspective is how shapes create the illusion of depth!' },
    { question: 'What do we call the way sizes are compared in art?', options: ['Proportion', 'Perspective'], correct: 'Proportion', emoji: '📏', explanation: 'Proportion is how sizes are compared in art!' },
    { question: 'What do we call the way colors create mood in art?', options: ['Atmosphere', 'Texture'], correct: 'Atmosphere', emoji: '🌅', explanation: 'Atmosphere is how colors create mood and feeling in art!' },
    { question: 'What do we call the way lines create energy in art?', options: ['Movement', 'Stillness'], correct: 'Movement', emoji: '💨', explanation: 'Movement is how lines create energy and flow in art!' },
    { question: 'What do we call the way shapes create unity in art?', options: ['Unity', 'Variety'], correct: 'Unity', emoji: '🔗', explanation: 'Unity is how shapes work together to create harmony in art!' }
  ];

  const geographyQuestions = [
    // Map Skills Questions (Week 11 Social Studies Test)
    { question: 'What is the name of the symbol that shows directions on a map?', options: ['Compass Rose', 'Map Key'], correct: 'Compass Rose', emoji: '🧭', explanation: 'A compass rose shows directions like North, South, East, and West!' },
    { question: 'Which direction comes between North and South on a compass?', options: ['East', 'West'], correct: 'East', emoji: '➡️', explanation: 'East is between North and South!' },
    { question: 'What country is to the north of the United States?', options: ['Canada', 'Mexico'], correct: 'Canada', emoji: '🇨🇦', explanation: 'Canada is directly north of the United States!' },
    { question: 'What is your country called?', options: ['United States of America', 'Mexico'], correct: 'United States of America', emoji: '🇺🇸', explanation: 'We live in the United States of America!' },
    { question: 'What is the name of the symbol on a map that shows what different symbols mean?', options: ['Map Key or Legend', 'Compass Rose'], correct: 'Map Key or Legend', emoji: '🗺️', explanation: 'A map key or legend explains what the symbols on the map mean!' },
    
    // Traditional Geography Questions
    { question: 'What is the biggest ocean?', options: ['Pacific Ocean', 'Atlantic Ocean'], correct: 'Pacific Ocean', emoji: '🌊', explanation: 'The Pacific Ocean is the largest ocean on Earth!' },
    { question: 'What is the biggest continent?', options: ['Asia', 'Africa'], correct: 'Asia', emoji: '🌏', explanation: 'Asia is the largest continent on Earth!' },
    { question: 'What is the coldest continent?', options: ['Antarctica', 'North America'], correct: 'Antarctica', emoji: '🧊', explanation: 'Antarctica is the coldest continent with lots of ice!' },
    { question: 'What is the hottest continent?', options: ['Africa', 'Australia'], correct: 'Africa', emoji: '🌍', explanation: 'Africa has the hottest deserts and climates!' },
    { question: 'What is the longest river?', options: ['Nile River', 'Amazon River'], correct: 'Nile River', emoji: '🌊', explanation: 'The Nile River in Africa is the longest river in the world!' },
    { question: 'What is the tallest mountain?', options: ['Mount Everest', 'Mount Kilimanjaro'], correct: 'Mount Everest', emoji: '🏔️', explanation: 'Mount Everest is the tallest mountain on Earth!' },
    { question: 'What is the biggest desert?', options: ['Sahara Desert', 'Gobi Desert'], correct: 'Sahara Desert', emoji: '🏜️', explanation: 'The Sahara Desert in Africa is the largest hot desert!' },
    { question: 'What country has the most people?', options: ['China', 'India'], correct: 'China', emoji: '🇨🇳', explanation: 'China has the most people of any country in the world!' },
    { question: 'What is the smallest continent?', options: ['Australia', 'Europe'], correct: 'Australia', emoji: '🇦🇺', explanation: 'Australia is the smallest continent on Earth!' },
    { question: 'What is the biggest country?', options: ['Russia', 'Canada'], correct: 'Russia', emoji: '🇷🇺', explanation: 'Russia is the largest country in the world!' },
    { question: 'What is the smallest country?', options: ['Vatican City', 'Monaco'], correct: 'Vatican City', emoji: '🇻🇦', explanation: 'Vatican City is the smallest country in the world!' },
    { question: 'What is the biggest island?', options: ['Greenland', 'Australia'], correct: 'Greenland', emoji: '🇬🇱', explanation: 'Greenland is the largest island in the world!' },
    { question: 'What is the deepest ocean?', options: ['Pacific Ocean', 'Atlantic Ocean'], correct: 'Pacific Ocean', emoji: '🌊', explanation: 'The Pacific Ocean is also the deepest ocean!' },
    { question: 'What is the biggest lake?', options: ['Caspian Sea', 'Lake Superior'], correct: 'Caspian Sea', emoji: '🏞️', explanation: 'The Caspian Sea is the largest lake in the world!' },
    { question: 'What is the biggest waterfall?', options: ['Angel Falls', 'Niagara Falls'], correct: 'Angel Falls', emoji: '💧', explanation: 'Angel Falls in Venezuela is the tallest waterfall!' },
    { question: 'What is the biggest forest?', options: ['Amazon Rainforest', 'Congo Rainforest'], correct: 'Amazon Rainforest', emoji: '🌳', explanation: 'The Amazon Rainforest is the largest forest in the world!' },
    { question: 'What is the biggest city?', options: ['Tokyo', 'New York'], correct: 'Tokyo', emoji: '🏙️', explanation: 'Tokyo, Japan is the largest city in the world!' },
    { question: 'What is the biggest state in the USA?', options: ['Alaska', 'Texas'], correct: 'Alaska', emoji: '🇺🇸', explanation: 'Alaska is the largest state in the United States!' },
    { question: 'What is the smallest state in the USA?', options: ['Rhode Island', 'Delaware'], correct: 'Rhode Island', emoji: '🇺🇸', explanation: 'Rhode Island is the smallest state in the United States!' },
    { question: 'What is the biggest country in South America?', options: ['Brazil', 'Argentina'], correct: 'Brazil', emoji: '🇧🇷', explanation: 'Brazil is the largest country in South America!' },
    { question: 'What is the biggest country in Africa?', options: ['Algeria', 'Nigeria'], correct: 'Algeria', emoji: '🇩🇿', explanation: 'Algeria is the largest country in Africa!' },
    { question: 'What is the biggest country in Europe?', options: ['Russia', 'Germany'], correct: 'Russia', emoji: '🇷🇺', explanation: 'Russia is the largest country in Europe!' },
    { question: 'What is the biggest country in Asia?', options: ['China', 'India'], correct: 'China', emoji: '🇨🇳', explanation: 'China is the largest country in Asia!' },
    { question: 'What is the biggest country in North America?', options: ['Canada', 'United States'], correct: 'Canada', emoji: '🇨🇦', explanation: 'Canada is the largest country in North America!' },
    { question: 'What is the biggest country in Oceania?', options: ['Australia', 'New Zealand'], correct: 'Australia', emoji: '🇦🇺', explanation: 'Australia is the largest country in Oceania!' },
    { question: 'What is the biggest desert?', options: ['Sahara Desert', 'Antarctic Desert'], correct: 'Antarctic Desert', emoji: '🏜️', explanation: 'The Antarctic Desert is the largest desert in the world!' },
    { question: 'What is the biggest mountain range?', options: ['Himalayas', 'Andes'], correct: 'Himalayas', emoji: '🏔️', explanation: 'The Himalayas are the largest mountain range in the world!' },
    { question: 'What is the biggest river in the world?', options: ['Nile River', 'Amazon River'], correct: 'Nile River', emoji: '🌊', explanation: 'The Nile River is the longest river in the world!' },
    { question: 'What is the biggest river in South America?', options: ['Amazon River', 'Paraná River'], correct: 'Amazon River', emoji: '🌊', explanation: 'The Amazon River is the largest river in South America!' },
    { question: 'What is the biggest river in North America?', options: ['Mississippi River', 'Missouri River'], correct: 'Mississippi River', emoji: '🌊', explanation: 'The Mississippi River is the largest river in North America!' },
    { question: 'What is the biggest river in Europe?', options: ['Volga River', 'Danube River'], correct: 'Volga River', emoji: '🌊', explanation: 'The Volga River is the largest river in Europe!' },
    { question: 'What is the biggest river in Asia?', options: ['Yangtze River', 'Ganges River'], correct: 'Yangtze River', emoji: '🌊', explanation: 'The Yangtze River is the largest river in Asia!' },
    { question: 'What is the biggest river in Africa?', options: ['Nile River', 'Congo River'], correct: 'Nile River', emoji: '🌊', explanation: 'The Nile River is the largest river in Africa!' },
    { question: 'What is the biggest lake in North America?', options: ['Lake Superior', 'Lake Michigan'], correct: 'Lake Superior', emoji: '🏞️', explanation: 'Lake Superior is the largest lake in North America!' },
    { question: 'What is the biggest lake in Africa?', options: ['Lake Victoria', 'Lake Tanganyika'], correct: 'Lake Victoria', emoji: '🏞️', explanation: 'Lake Victoria is the largest lake in Africa!' },
    { question: 'What is the biggest lake in Europe?', options: ['Lake Ladoga', 'Lake Onega'], correct: 'Lake Ladoga', emoji: '🏞️', explanation: 'Lake Ladoga is the largest lake in Europe!' },
    { question: 'What is the biggest lake in Asia?', options: ['Caspian Sea', 'Lake Baikal'], correct: 'Caspian Sea', emoji: '🏞️', explanation: 'The Caspian Sea is the largest lake in Asia!' }
  ];

  const historyQuestions = [
    { question: 'Who was the first president of the United States?', options: ['George Washington', 'Thomas Jefferson'], correct: 'George Washington', emoji: '👨‍💼', explanation: 'George Washington was the first president of the United States!' },
    { question: 'What year did Christopher Columbus sail to America?', options: ['1492', '1493'], correct: '1492', emoji: '⛵', explanation: 'Christopher Columbus sailed to America in 1492!' },
    { question: 'Who invented the light bulb?', options: ['Thomas Edison', 'Benjamin Franklin'], correct: 'Thomas Edison', emoji: '💡', explanation: 'Thomas Edison invented the light bulb!' },
    { question: 'What was the name of the ship that brought the Pilgrims to America?', options: ['Mayflower', 'Titanic'], correct: 'Mayflower', emoji: '🚢', explanation: 'The Mayflower brought the Pilgrims to America in 1620!' },
    { question: 'Who wrote the Declaration of Independence?', options: ['Thomas Jefferson', 'George Washington'], correct: 'Thomas Jefferson', emoji: '📜', explanation: 'Thomas Jefferson wrote the Declaration of Independence!' },
    { question: 'What war was fought between the North and South in America?', options: ['Civil War', 'Revolutionary War'], correct: 'Civil War', emoji: '⚔️', explanation: 'The Civil War was fought between the North and South!' },
    { question: 'Who was the first person to walk on the moon?', options: ['Neil Armstrong', 'Buzz Aldrin'], correct: 'Neil Armstrong', emoji: '🌙', explanation: 'Neil Armstrong was the first person to walk on the moon!' },
    { question: 'What year did World War II end?', options: ['1945', '1944'], correct: '1945', emoji: '✌️', explanation: 'World War II ended in 1945!' },
    { question: 'Who was the 16th president of the United States?', options: ['Abraham Lincoln', 'Andrew Jackson'], correct: 'Abraham Lincoln', emoji: '👨‍💼', explanation: 'Abraham Lincoln was the 16th president of the United States!' },
    { question: 'What year did the American Revolution start?', options: ['1775', '1776'], correct: '1775', emoji: '🇺🇸', explanation: 'The American Revolution started in 1775!' },
    { question: 'Who invented the telephone?', options: ['Alexander Graham Bell', 'Thomas Edison'], correct: 'Alexander Graham Bell', emoji: '📞', explanation: 'Alexander Graham Bell invented the telephone!' },
    { question: 'What year did the United States become independent?', options: ['1776', '1775'], correct: '1776', emoji: '🇺🇸', explanation: 'The United States became independent in 1776!' },
    { question: 'Who was the first woman to fly across the Atlantic Ocean?', options: ['Amelia Earhart', 'Bessie Coleman'], correct: 'Amelia Earhart', emoji: '✈️', explanation: 'Amelia Earhart was the first woman to fly across the Atlantic!' },
    { question: 'What year did the Titanic sink?', options: ['1912', '1913'], correct: '1912', emoji: '🚢', explanation: 'The Titanic sank in 1912!' },
    { question: 'Who was the first person to discover America?', options: ['Christopher Columbus', 'Leif Erikson'], correct: 'Christopher Columbus', emoji: '🗺️', explanation: 'Christopher Columbus was the first European to discover America!' },
    { question: 'What year did the Civil War start?', options: ['1861', '1860'], correct: '1861', emoji: '⚔️', explanation: 'The Civil War started in 1861!' },
    { question: 'Who was the first person to fly an airplane?', options: ['Orville Wright', 'Amelia Earhart'], correct: 'Orville Wright', emoji: '✈️', explanation: 'Orville Wright was the first person to fly an airplane!' },
    { question: 'What year did World War I start?', options: ['1914', '1915'], correct: '1914', emoji: '🌍', explanation: 'World War I started in 1914!' },
    { question: 'What year did World War I end?', options: ['1918', '1919'], correct: '1918', emoji: '✌️', explanation: 'World War I ended in 1918!' },
    { question: 'What year did World War II start?', options: ['1939', '1940'], correct: '1939', emoji: '🌍', explanation: 'World War II started in 1939!' },
    { question: 'What year did World War II end?', options: ['1945', '1946'], correct: '1945', emoji: '✌️', explanation: 'World War II ended in 1945!' },
    { question: 'Who was the first person to fly an airplane?', options: ['Orville Wright', 'Amelia Earhart'], correct: 'Orville Wright', emoji: '✈️', explanation: 'Orville Wright was the first person to fly an airplane!' },
    { question: 'What year did the Wright brothers fly their first airplane?', options: ['1903', '1904'], correct: '1903', emoji: '✈️', explanation: 'The Wright brothers flew their first airplane in 1903!' },
    { question: 'Who was the first person to discover America?', options: ['Christopher Columbus', 'Leif Erikson'], correct: 'Christopher Columbus', emoji: '🗺️', explanation: 'Christopher Columbus was the first European to discover America!' },
    { question: 'What year did the American Revolution start?', options: ['1775', '1776'], correct: '1775', emoji: '🇺🇸', explanation: 'The American Revolution started in 1775!' },
    { question: 'What year did the American Revolution end?', options: ['1783', '1784'], correct: '1783', emoji: '🇺🇸', explanation: 'The American Revolution ended in 1783!' },
    { question: 'Who was the first person to walk on the moon?', options: ['Neil Armstrong', 'Buzz Aldrin'], correct: 'Neil Armstrong', emoji: '🌙', explanation: 'Neil Armstrong was the first person to walk on the moon!' },
    { question: 'What year did the first person walk on the moon?', options: ['1969', '1970'], correct: '1969', emoji: '🌙', explanation: 'The first person walked on the moon in 1969!' },
    { question: 'Who invented the telephone?', options: ['Alexander Graham Bell', 'Thomas Edison'], correct: 'Alexander Graham Bell', emoji: '📞', explanation: 'Alexander Graham Bell invented the telephone!' },
    { question: 'What year was the telephone invented?', options: ['1876', '1877'], correct: '1876', emoji: '📞', explanation: 'The telephone was invented in 1876!' },
    { question: 'Who invented the light bulb?', options: ['Thomas Edison', 'Benjamin Franklin'], correct: 'Thomas Edison', emoji: '💡', explanation: 'Thomas Edison invented the light bulb!' },
    { question: 'What year was the light bulb invented?', options: ['1879', '1880'], correct: '1879', emoji: '💡', explanation: 'The light bulb was invented in 1879!' },
    { question: 'Who was the first woman to fly across the Atlantic Ocean?', options: ['Amelia Earhart', 'Bessie Coleman'], correct: 'Amelia Earhart', emoji: '✈️', explanation: 'Amelia Earhart was the first woman to fly across the Atlantic!' },
    { question: 'What year did Amelia Earhart fly across the Atlantic?', options: ['1928', '1929'], correct: '1928', emoji: '✈️', explanation: 'Amelia Earhart flew across the Atlantic in 1928!' },
    { question: 'Who was the first person to discover electricity?', options: ['Benjamin Franklin', 'Thomas Edison'], correct: 'Benjamin Franklin', emoji: '⚡', explanation: 'Benjamin Franklin discovered electricity!' },
    { question: 'What year did Benjamin Franklin discover electricity?', options: ['1752', '1753'], correct: '1752', emoji: '⚡', explanation: 'Benjamin Franklin discovered electricity in 1752!' },
    { question: 'Who was the first person to discover gravity?', options: ['Isaac Newton', 'Galileo Galilei'], correct: 'Isaac Newton', emoji: '🍎', explanation: 'Isaac Newton discovered gravity!' },
    { question: 'What year did Isaac Newton discover gravity?', options: ['1687', '1688'], correct: '1687', emoji: '🍎', explanation: 'Isaac Newton discovered gravity in 1687!' }
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
          words: ['duck', 'back', 'pack', 'sack', 'tack', 'black', 'clock', 'dock', 'block', 'rock', 'sock', 'lock', 'shock', 'stock', 'truck', 'stuck']
        },
        {
          name: 'TCH Words',
          words: ['catch', 'match', 'patch', 'watch', 'stretch', 'fetch', 'itch', 'notch', 'stitch', 'ditch', 'witch', 'hitch', 'switch', 'sketch', 'scratch']
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
    
    // Track this question in history to avoid repeats
    const currentQ = qs[currentQuestion];
    if (currentQ) {
      const questionId = getQuestionId(currentQ);
      trackQuestionHistory(currentScreen, questionId);
    }
    
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
      
      // Show wrong answer popup instead of auto-continuing
      setWrongAnswerData({
        selectedAnswer: sel,
        correctAnswer: cor,
        explanation: explanation,
        question: qs[currentQuestion]
      });
      setShowWrongAnswerModal(true);
    }
    
    // Only auto-continue for correct answers
    if (ok) {
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
    }, 1500);
    }
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
    
    // Extra scroll delay for question selector flow to ensure proper mobile experience
    setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
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
                    <div className="text-xs text-white/80 mb-1">{getQuestionCount(game.name)} questions</div>
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
          
          
            {/* Main Action Buttons - Child-Focused */}
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <div onClick={() => navigateTo('customize')} 
                className="px-6 py-3 bg-green-500 text-white rounded-full font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition-transform">
                🎨 Customize
              </div>
              <div onClick={() => setShowSearch(true)} 
                className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition-transform">
                🔍 Search
              </div>
              <div onClick={() => { playSound('click'); triggerHaptic('light'); toggleMusic(); }} 
                className={`px-6 py-3 text-white rounded-full font-bold cursor-pointer hover:opacity-80 active:scale-95 transition-transform ${isMusicPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isMusicPlaying ? '🔇 Music Off' : '🎵 Music On'}
              </div>
            </div>
          </div>
          

          {/* Parent Tools & Reference */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-center text-purple-800 mb-3">📚 Parent Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
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

              {/* Calendar */}
              <div onClick={() => { 
                playSound('click'); 
                triggerHaptic('light'); 
                navigateTo('calendar'); 
              }} 
                className="bg-gradient-to-br from-teal-400 to-cyan-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📅</div>
                <h3 className="text-sm font-bold text-white">Calendar</h3>
                <p className="text-xs text-teal-100">School events</p>
              </div>

              {/* Field Trips */}
              <div onClick={() => { 
                playSound('click'); 
                triggerHaptic('light'); 
                navigateTo('field-trips'); 
              }} 
                className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">🗺️</div>
                <h3 className="text-sm font-bold text-white">Field Trips</h3>
                <p className="text-xs text-green-100">Upcoming trips</p>
              </div>

              {/* Smore Newsletters */}
              <div onClick={() => { 
                playSound('click'); 
                triggerHaptic('light'); 
                navigateTo('smore'); 
              }} 
                className="bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📰</div>
                <h3 className="text-sm font-bold text-white">Smore</h3>
                <p className="text-xs text-orange-100">Scopes</p>
              </div>

              {/* Legend/Glossary */}
              <div onClick={() => { 
                playSound('click'); 
                triggerHaptic('light'); 
                setShowLegendModal(true); 
                
                // Direct DOM manipulation with updated Standards-Based Grading info
                const modal = document.createElement('div');
                modal.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background-color: rgba(0,0,0,0.8);
                  z-index: 99999;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                `;
                
                const content = document.createElement('div');
                content.style.cssText = `
                  background: white;
                  padding: 40px;
                  border-radius: 20px;
                  max-width: 800px;
                  max-height: 80vh;
                  overflow-y: auto;
                  text-align: center;
                `;
                
                content.innerHTML = `
                  <div style="position: relative;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                      position: absolute;
                      top: 10px;
                      right: 10px;
                      background: #ef4444;
                      color: white;
                      border: none;
                      border-radius: 50%;
                      width: 30px;
                      height: 30px;
                      font-size: 16px;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: bold;
                    ">×</button>
                  </div>
                  <h2 style="color: purple; font-size: 24px; margin-bottom: 20px;">📖 Educational Terms & Acronyms</h2>
                  <p style="margin-bottom: 30px;">A guide to help parents understand school terminology</p>
                  
                  <div style="text-align: left; margin-bottom: 30px; background: #f0fdf4; padding: 20px; border-radius: 10px; border: 2px solid #22c55e;">
                    <h3 style="color: #15803d; font-size: 18px; margin-bottom: 15px;">📊 Standards-Based Grading</h3>
                    <p style="margin-bottom: 15px; font-size: 14px;"><strong>What is Standards-Based Grading?</strong><br/>
                    A system where students receive feedback around "fixed targets" or competencies. Non-academic factors (participation, late assignments, etc.) are removed, so the final grade represents what the student knows and can do.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <strong style="color: #3b82f6;">PF - Proficient:</strong><br/>
                        <span style="font-size: 12px;">"I got it! I have mastered the content!"</span>
                      </div>
                      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316;">
                        <strong style="color: #f97316;">PG - Progressing:</strong><br/>
                        <span style="font-size: 12px;">"I am almost there. I need some support with the skill."</span>
                      </div>
                      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                        <strong style="color: #ef4444;">DV - Developing:</strong><br/>
                        <span style="font-size: 12px;">"I need additional class and home support. Urgent intervention is needed."</span>
                      </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                      <h4 style="color: #15803d; margin-bottom: 10px;">Key Benefits:</h4>
                      <ul style="font-size: 12px; margin: 0; padding-left: 20px;">
                        <li>Learning is prioritized over compliance</li>
                        <li>Growth mindset develops</li>
                        <li>Motivation to learn increases</li>
                        <li>Grades have meaning</li>
                        <li>Clear vision of success</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div style="text-align: left; margin-bottom: 20px;">
                    <h3 style="color: #1e40af;">🎒 First Grade Terms</h3>
                    <p><strong>ELA:</strong> English Language Arts</p>
                    <p><strong>CVC:</strong> Consonant-Vowel-Consonant words</p>
                    <p><strong>Sight Words:</strong> Common words learned by sight</p>
                    <p><strong>Phonics:</strong> Letter sounds and blending</p>
                  </div>
                  
                  <button onclick="this.parentElement.parentElement.remove()" style="
                    background: purple;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                  ">Close</button>
                `;
                
                modal.appendChild(content);
                document.body.appendChild(modal);
              }} 
                className="bg-gradient-to-br from-indigo-400 to-purple-500 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 cursor-pointer text-center transition-transform">
                <div className="text-3xl mb-1">📖</div>
                <h3 className="text-sm font-bold text-white">Legend</h3>
                <p className="text-xs text-indigo-100">Terms & acronyms</p>
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
    const filteredWords = getSpellingWordsByMonth(selectedSpellingMonth);
    const word = filteredWords[currentQuestion];
    console.log('Spelling game render:', { currentQuestion, word, filteredWordsLength: filteredWords.length, selectedMonth: selectedSpellingMonth });
    
    const colors = [
      { name: 'Purple', value: '#8B5CF6' }, { name: 'Pink', value: '#EC4899' },
      { name: 'Blue', value: '#3B82F6' }, { name: 'Green', value: '#10B981' },
      { name: 'Red', value: '#EF4444' }, { name: 'Orange', value: '#F97316' }
    ];

    const monthOptions = [
      { value: 'all', label: 'All Words', count: spellingWords.length },
      { value: 'october', label: 'October', count: 10 },
      { value: 'november', label: 'November', count: 10 },
      { value: 'december', label: 'December', count: 10 },
      { value: 'january', label: 'January', count: 10 },
      { value: 'february', label: 'February', count: 10 },
      { value: 'march', label: 'March', count: 10 },
      { value: 'additional', label: 'Extra Words', count: spellingWords.length - 60 }
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 to-purple-400 p-2 sm:p-4 md:p-8">
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-3 sm:mb-4">← Back</div>
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-4 sm:p-6 md:p-12">
          
          {/* Month Selector */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 mb-4 text-center">📅 Choose Your Word List</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {monthOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedSpellingMonth(option.value);
                    setCurrentQuestion(0);
                    playSound('click');
                    triggerHaptic('light');
                  }}
                  className={`p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 ${
                    selectedSpellingMonth === option.value
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <div className="font-bold">{option.label}</div>
                  <div className="text-xs opacity-80">{option.count} words</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Word Display */}
          <div key={`word-section-${currentQuestion}`} className="text-center mb-6 sm:mb-8">
            <div className="text-3xl sm:text-4xl md:text-5xl mb-3">✏️</div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2">Word #{currentQuestion + 1} of {filteredWords.length}</p>
            <div className="text-3xl sm:text-4xl md:text-6xl font-bold text-purple-700 mb-4 sm:mb-6">{word?.word || 'Loading...'}</div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 italic">Hint: {word?.hint || 'Loading...'}</p>
          </div>
          
          <div className="mb-6 sm:mb-8">
            <p className="text-center text-sm sm:text-base md:text-lg font-bold text-purple-700 mb-3 sm:mb-4">🌈 Choose Rainbow Color!</p>
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
              {colors.map(color => (
                <div key={color.value} onClick={() => { setDrawColor(color.value); triggerHaptic('light'); }}
                  className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform ${drawColor === color.value ? 'ring-4 ring-yellow-400' : ''}`}
                  style={{ backgroundColor: color.value }}
                  role="button"
                  aria-label={`Select ${color.name} color`}
                  tabIndex={0} />
              ))}
            </div>
          </div>
          
          <div key={`canvas-section-${currentQuestion}`} className="bg-gradient-to-br from-yellow-50 to-pink-50 p-3 sm:p-4 md:p-8 rounded-2xl border-4 border-purple-300">
            <p className="text-lg md:text-xl text-center text-purple-700 font-bold mb-4 sm:mb-6">✍️ Write 5 times!</p>
            <div className="space-y-4 sm:space-y-5">
              {[0,1,2,3,4].map(i => (
                <div key={i}>
                  <div className="flex items-center mb-2">
                    <span className="text-xl font-bold text-purple-600 mr-3">{i+1}.</span>
                    <div onClick={() => { clearCanvas(i); triggerHaptic('light'); }} className="ml-auto px-3 py-1 bg-red-400 text-white rounded-full text-sm font-bold cursor-pointer hover:bg-red-500 active:scale-95 transition-transform">Clear</div>
                  </div>
                  <canvas ref={canvasRefs[i]} width={600} height={120}
                    onMouseDown={(e) => startDrawing(e, i)} onMouseMove={(e) => draw(e, i)} 
                    onMouseUp={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    onTouchStart={(e) => startDrawing(e, i)} onTouchMove={(e) => draw(e, i)} 
                    onTouchEnd={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    className="w-full h-24 sm:h-28 md:h-32 border-4 border-dashed border-purple-300 rounded-xl bg-white cursor-crosshair touch-none select-none"
                    style={{touchAction: 'none'}}
                    role="img"
                    aria-label={`Drawing canvas ${i+1} for spelling practice`}
                    tabIndex={0} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 sm:mt-8 flex justify-between gap-3 sm:gap-4">
            <div onClick={() => { 
              console.log('Prev button clicked!', { currentQuestion });
              if(currentQuestion>0) { 
                console.log('Moving to previous question');
                setCurrentQuestion(currentQuestion-1); 
                playSound('click');
                triggerHaptic('light'); 
                // Scroll to top after a brief delay to ensure the new word is rendered
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              } 
            }} 
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold bg-gray-300 rounded-full cursor-pointer active:scale-95 transition-transform ${currentQuestion===0?'opacity-50':''}`}>← Prev</div>
            <div onClick={() => { 
              console.log('Next button clicked!', { currentQuestion, filteredWordsLength: filteredWords.length });
              if(currentQuestion<filteredWords.length-1) { 
                console.log('Moving to next question');
                setCurrentQuestion(currentQuestion+1); 
                playSound('click');
                triggerHaptic('light'); 
                // Scroll to top after a brief delay to ensure the new word is rendered
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              } else { 
                console.log('Going to home');
                playSound('complete');
                triggerHaptic('success'); 
                navigateTo('home'); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              } 
            }} 
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold bg-purple-500 text-white rounded-full cursor-pointer active:scale-95 transition-transform">
              {currentQuestion < filteredWords.length-1 ? 'Next →' : 'Done 🎉'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'calendar') {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentDate = new Date();
    const currentMonth = selectedCalendarMonth;
    const currentYear = currentDate.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get events for current month
    const monthEvents = calendarEvents[currentMonth] || [];

    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push({ day: '', isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = monthEvents.filter(event => event.date === day);
      calendarDays.push({ 
        day, 
        isEmpty: false, 
        events: dayEvents,
        isToday: day === currentDate.getDate() && currentMonth === currentDate.getMonth()
      });
    }

    const getEventTypeColor = (type) => {
      switch (type) {
        case 'test': return 'bg-red-100 text-red-800 border-red-200';
        case 'event': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'holiday': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getEventTypeIcon = (type) => {
      switch (type) {
        case 'test': return '📝';
        case 'event': return '🎉';
        case 'holiday': return '🏫';
        default: return '📅';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-200 to-teal-400 p-4 md:p-8">
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
          className="bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📅</div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-2">School Calendar</h1>
            <p className="text-lg text-gray-600">Important dates and events from Smore newsletters</p>
          </div>

          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                setSelectedCalendarMonth(selectedCalendarMonth === 0 ? 11 : selectedCalendarMonth - 1);
                playSound('click');
                triggerHaptic('light');
              }}
              className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors"
            >
              ← Previous
            </button>
            
            <h2 className="text-2xl md:text-3xl font-bold text-teal-700">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            
            <button
              onClick={() => {
                setSelectedCalendarMonth(selectedCalendarMonth === 11 ? 0 : selectedCalendarMonth + 1);
                playSound('click');
                triggerHaptic('light');
              }}
              className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-bold text-teal-600 bg-teal-50 rounded-lg">
                {day}
              </div>
            ))}
            
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg flex flex-col ${
                  dayData.isEmpty 
                    ? 'bg-gray-50' 
                    : dayData.isToday 
                      ? 'bg-teal-100 border-teal-300' 
                      : 'bg-white border-gray-200 hover:bg-teal-50'
                }`}
              >
                {!dayData.isEmpty && (
                  <>
                    <div className={`text-sm font-bold mb-2 ${
                      dayData.isToday ? 'text-teal-700' : 'text-gray-700'
                    }`}>
                      {dayData.day}
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {dayData.events.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} flex-shrink-0`}
                          title={event.description}
                        >
                          <span className="mr-1">{getEventTypeIcon(event.type)}</span>
                          <span className="break-words leading-tight">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="bg-teal-50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-teal-700 mb-4">📋 Event Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span className="font-semibold text-red-700">Tests & Assessments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <span className="font-semibold text-blue-700">School Events & Parties</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏫</span>
                <span className="font-semibold text-green-700">Holidays & Breaks</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">🔗 Quick Links</h3>
            <p className="mb-4">For scopes and additional school information:</p>
            <button
              onClick={() => navigateTo('smore')}
              className="inline-block bg-white text-teal-600 px-6 py-3 rounded-full font-bold hover:bg-teal-50 transition-colors transform hover:scale-105 active:scale-95 mr-4"
            >
              📰 Smore Scopes
            </button>
            <button
              onClick={() => navigateTo('newsletter')}
              className="inline-block bg-white text-teal-600 px-6 py-3 rounded-full font-bold hover:bg-teal-50 transition-colors transform hover:scale-105 active:scale-95"
            >
              📱 App Newsletters
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'smore') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-red-300 p-4 md:p-8">
        <div onClick={() => { navigateTo('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
          className="bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-4">← Back</div>
        
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📰</div>
            <h1 className="text-3xl md:text-4xl font-bold text-orange-700 mb-2">Smore Scopes</h1>
            <p className="text-lg text-gray-600">Monthly school scopes and updates for 2025</p>
            <p className="text-sm text-gray-500 mt-2">Updated: January 2025</p>
          </div>

          {/* Current Month Scope */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-8 border-2 border-orange-200">
            <h2 className="text-2xl font-bold text-orange-700 mb-4">📅 Current Month</h2>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-3">October 2025 Scope</h3>
              <p className="text-gray-600 mb-4">Stay updated with the latest school news, events, and important dates for the 2025-2026 school year.</p>
              <a
                href="https://app.smore.com/n/9tvrj"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-colors transform hover:scale-105 active:scale-95"
              >
                📖 Read Current Scope
              </a>
            </div>
          </div>

          {/* Scope Archive */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">📚 Scope Archive</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* September 2025 */}
              <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-gray-800 mb-2">September 2025</h3>
                <p className="text-sm text-gray-600 mb-3">Back to school scope with welcome information and September events.</p>
                <a
                  href="https://app.smore.com/n/a4hu8n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
                >
                  View Scope →
                </a>
              </div>

              {/* August 2025 */}
              <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-gray-800 mb-2">August 2025</h3>
                <p className="text-sm text-gray-600 mb-3">Summer wrap-up and preparation for the new school year.</p>
                <a
                  href="https://app.smore.com/n/9tvrj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
                >
                  View Scope →
                </a>
              </div>

              {/* July 2025 */}
              <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-gray-800 mb-2">July 2025</h3>
                <p className="text-sm text-gray-600 mb-3">Summer activities and important dates for the upcoming school year.</p>
                <a
                  href="https://app.smore.com/n/9tvrj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
                >
                  View Scope →
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-green-700 mb-4">🔗 Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-2">📅 School Calendar</h3>
                <p className="text-sm text-gray-600 mb-3">View all school events, holidays, and important dates.</p>
                <button
                  onClick={() => navigateTo('calendar')}
                  className="text-green-600 hover:text-green-800 text-sm font-semibold underline"
                >
                  View Calendar →
                </button>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-2">📱 App Newsletters</h3>
                <p className="text-sm text-gray-600 mb-3">Access weekly newsletters directly in the app.</p>
                <button
                  onClick={() => navigateTo('newsletter')}
                  className="text-green-600 hover:text-green-800 text-sm font-semibold underline"
                >
                  View App Newsletters →
                </button>
              </div>
            </div>
          </div>

          {/* Direct Smore Link */}
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">🌐 Visit Smore Website</h3>
            <p className="mb-4">For the most up-to-date scopes and school information, visit the official Smore page:</p>
            <a
              href="https://app.smore.com/n/9tvrj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-orange-50 transition-colors transform hover:scale-105 active:scale-95"
            >
              📖 Open Smore Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'complete') {
    // Calculate base percentage (without bonus points)
    const baseScore = currentQuestion * 10; // Maximum possible base score
    const basePercentage = Math.round((baseScore / baseScore) * 100); // Always 100% if completed
    const bonusPoints = score - baseScore; // Any points above base score are bonus
    const questionsAnswered = currentQuestion + 1; // currentQuestion is 0-indexed, so add 1
    const percentage = Math.round((score / (questionsAnswered * 10)) * 100); // For display purposes
    
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
          <p className="text-xl text-gray-600 mb-4">You completed {subjectName} with 100% accuracy!</p>
          {bonusPoints > 0 && (
            <p className="text-lg text-green-600 font-semibold mb-8">+{bonusPoints} bonus points for perfect score! 🌟</p>
          )}
          
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
                    <p>• Questions: {questionsAnswered}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="text-center">
                  <button
                    onClick={() => handleEmailShare('direct')}
                    disabled={!shareEmail || isSendingEmail}
                    className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    {isSendingEmail ? '⏳ Sending...' : '📧 Send Now'}
                  </button>
                </div>
                
                {emailSent && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center">
                    ✅ Email sent successfully!
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                </div>
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
                <div className="text-center">
                <button
                    onClick={() => handleProgressEmailShare('direct')}
                    disabled={!shareEmail || isSendingEmail}
                    className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    {isSendingEmail ? '⏳ Sending...' : '📧 Send Now'}
                </button>
              </div>
                
                {emailSent && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center mt-3">
                    ✅ Email sent successfully!
                  </div>
                )}
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
      7: Week7Newsletter,
      8: Week8Newsletter,
      9: Week9Newsletter,
      10: Week10Newsletter,
      11: Week11Newsletter
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

  if (currentScreen === 'field-trips') {
    return (
      <FieldTrips onBack={() => navigateTo('home')} />
    );
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
    phonics: getPhonicsQuestionsByDifficulty(selectedPhonicsDifficulty), 
    math: getMathQuestionsByDifficulty(selectedMathDifficulty), 
    reading: getReadingQuestionsByCategory(selectedReadingCategory), 
    science: scienceQuestions, 
    social: socialStudiesQuestions, 
    skipcounting: skipCountingQuestions, 
    art: artQuestions, 
    geography: geographyQuestions, 
    history: historyQuestions
  };
  
  // Shuffle function to randomize questions (fallback for simple cases)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get the full question set, use smart shuffle to avoid repeats
  const fullQuestionSet = questionSets[currentScreen] || [];
  const questionCount = selectedQuestionCount === 'custom' 
    ? parseInt(customQuestionCount) || 10
    : selectedQuestionCount;
  
  // Use smart shuffle to avoid recent questions
  const qs = smartShuffle(fullQuestionSet, currentScreen, questionCount);
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

      {/* Difficulty/Category Selectors */}
      {currentScreen === 'phonics' && (
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold text-center mb-4">📚 Choose Difficulty Level</h2>
          <div className="flex justify-center gap-3">
            {['easy', 'medium', 'hard'].map(level => (
              <button
                key={level}
                onClick={() => {
                  setSelectedPhonicsDifficulty(level);
                  setCurrentQuestion(0);
                  playSound('click');
                  triggerHaptic('light');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm md:text-base transition-all transform hover:scale-105 active:scale-95 ${
                  selectedPhonicsDifficulty === level
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'math' && (
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold text-center mb-4">🔢 Choose Difficulty Level</h2>
          <div className="flex justify-center gap-3">
            {['easy', 'medium', 'hard'].map(level => (
              <button
                key={level}
                onClick={() => {
                  setSelectedMathDifficulty(level);
                  setCurrentQuestion(0);
                  playSound('click');
                  triggerHaptic('light');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm md:text-base transition-all transform hover:scale-105 active:scale-95 ${
                  selectedMathDifficulty === level
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'reading' && (
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold text-center mb-4">📖 Choose Reading Focus</h2>
          <div className="flex justify-center gap-3">
            {[
              { value: 'all', label: 'All Questions' },
              { value: 'story-elements', label: 'Story Elements' },
              { value: 'comprehension', label: 'Comprehension' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedReadingCategory(option.value);
                  setCurrentQuestion(0);
                  playSound('click');
                  triggerHaptic('light');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm md:text-base transition-all transform hover:scale-105 active:scale-95 ${
                  selectedReadingCategory === option.value
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
          {q.word && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-4xl md:text-6xl font-bold text-pink-600">{q.word}</div>
              <button
                onClick={() => textToSpeech.speakWord(q.word)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors flex-shrink-0"
                title="Listen to word"
                aria-label="Listen to word"
              >
                🔊
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mb-8">
            <p className="text-2xl md:text-3xl font-bold text-gray-700">{q.question}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => textToSpeech.speakQuestion(q.question)}
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors"
                title="Listen to question"
                aria-label="Listen to question"
              >
                🔊
              </button>
              <button
                onClick={() => textToSpeech.stop()}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
                title="Stop audio"
                aria-label="Stop audio"
              >
                ⏹️
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {(q.options || []).map((opt, i) => (
            <div key={i} className="relative">
              <div 
                onClick={() => { triggerHaptic('medium'); handleAnswer(opt, q.correct || q.answer, qs, q.explanation); }} 
                className="p-6 md:p-8 text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:scale-110 active:scale-105 cursor-pointer bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 transition-transform"
                role="button"
                aria-label={`Answer option: ${opt}`}
                tabIndex={0}
              >
                {opt}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  textToSpeech.speakAnswer(opt);
                }}
                className="absolute top-3 right-3 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors shadow-md"
                title="Listen to answer"
                aria-label="Listen to answer"
              >
                🔊
              </button>
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

      {/* Wrong Answer Modal */}

      {/* Legend/Glossary Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">Educational Terms & Acronyms</h2>
                <p className="text-gray-600">A guide to help parents understand school terminology</p>
              </div>
              <div className="space-y-6">
                {/* Standards-Based Grading */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-700 mb-4">📊 Standards-Based Grading</h3>
                  <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>What is Standards-Based Grading?</strong><br/>
                      A system where students receive feedback around "fixed targets" or competencies. 
                      Non-academic factors (participation, late assignments, etc.) are removed, so the final grade 
                      represents what the student knows and can do.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                      <span className="font-bold text-blue-600">PF - Proficient:</span>
                      <p className="text-sm text-gray-600">"I got it! I have mastered the content!"</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                      <span className="font-bold text-orange-600">PG - Progressing:</span>
                      <p className="text-sm text-gray-600">"I am almost there. I need some support with the skill."</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                      <span className="font-bold text-red-600">DV - Developing:</span>
                      <p className="text-sm text-gray-600">"I need additional class and home support. Urgent intervention is needed."</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-green-700 mb-2">Key Benefits:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Learning is prioritized over compliance</li>
                      <li>• Growth mindset develops</li>
                      <li>• Motivation to learn increases</li>
                      <li>• Grades have meaning</li>
                      <li>• Clear vision of success</li>
                    </ul>
                  </div>
                </div>

                {/* First Grade Specific Terms */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-700 mb-4">🎒 First Grade Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">ELA:</span>
                        <p className="text-sm text-gray-600">English Language Arts</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">CVC:</span>
                        <p className="text-sm text-gray-600">Consonant-Vowel-Consonant words</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">Sight Words:</span>
                        <p className="text-sm text-gray-600">Common words learned by sight</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">Phonics:</span>
                        <p className="text-sm text-gray-600">Letter sounds and blending</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">Number Sense:</span>
                        <p className="text-sm text-gray-600">Understanding numbers 0-20</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">Skip Counting:</span>
                        <p className="text-sm text-gray-600">Counting by 2s, 5s, 10s</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">Story Elements:</span>
                        <p className="text-sm text-gray-600">Characters, setting, problem, solution</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-blue-600">PTA:</span>
                        <p className="text-sm text-gray-600">Parent-Teacher Association</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* App-Specific Terms */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                  <h3 className="text-xl font-bold text-yellow-700 mb-4">📱 App-Specific Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Perfect Score:</span>
                        <p className="text-sm text-gray-600">100% on any subject game</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Confidence Level:</span>
                        <p className="text-sm text-gray-600">How confident Emmy feels about each subject</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Learning Streak:</span>
                        <p className="text-sm text-gray-600">Consecutive days of learning</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Achievement:</span>
                        <p className="text-sm text-gray-600">Special rewards earned for milestones</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Smart Shuffle:</span>
                        <p className="text-sm text-gray-600">Algorithm that reduces repeat questions</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-yellow-600">Question History:</span>
                        <p className="text-sm text-gray-600">Tracks previously asked questions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setShowLegendModal(false);
                    playSound('click');
                    triggerHaptic('light');
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-colors transform hover:scale-105 active:scale-95"
                >
                  Got It! Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
      
      {/* Wrong Answer Modal - Rendered at top level for proper positioning */}
      {showWrongAnswerModal && wrongAnswerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😅</div>
              <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-2">Not Quite Right!</h2>
              <p className="text-gray-600">Let's learn from this mistake</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Question */}
              {wrongAnswerData.question && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-2">Question:</h3>
                  <p className="text-gray-600">
                    {wrongAnswerData.question.question || wrongAnswerData.question.word || 'Question not available'}
                  </p>
                </div>
              )}

              {/* Your Answer */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="font-bold text-red-700 mb-2">Your Answer:</h3>
                <p className="text-red-600 font-semibold">{wrongAnswerData.selectedAnswer}</p>
              </div>

              {/* Correct Answer */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-bold text-green-700 mb-2">Correct Answer:</h3>
                <p className="text-green-600 font-semibold">{wrongAnswerData.correctAnswer}</p>
              </div>

              {/* Explanation */}
              {wrongAnswerData.explanation && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-700 mb-2">Why?</h3>
                  <p className="text-blue-600">{wrongAnswerData.explanation}</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowWrongAnswerModal(false);
                  setWrongAnswerData(null);
                  setShowFeedback(null);
                  setAnswerAnimation('');
                  setCorrectAnswer('');
                  
                  // Continue to next question
                  const qs = questionSets[currentScreen] || [];
                  if (currentQuestion < qs.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                  } else {
                    // Game completed
                    const subjectScore = Math.round((score / (questionCount * 10)) * 100);
                    const isPerfectScore = subjectScore === 100;
                    
                    let newProgress = {
                      ...progress,
                      totalScore: progress.totalScore + score,
                      lastPlayed: new Date().toISOString(),
                      completedSubjects: {
                        ...progress.completedSubjects,
                        [currentScreen]: {
                          completed: true,
                          score: subjectScore,
                          completedAt: new Date().toISOString(),
                          questionsAnswered: questionCount,
                          correctAnswers: Math.floor(score / 10)
                        }
                      }
                    };
                    
                    if (isPerfectScore) {
                      newProgress.stats = newProgress.stats || {};
                      newProgress.stats.perfectScores = (newProgress.stats.perfectScores || 0) + 1;
                    }
                    
                    newProgress = checkAchievements(newProgress);
                    newProgress = checkUnlocks(newProgress);
                    
                    saveProgress(newProgress);
                    playSound('complete');
                    triggerHaptic('success');
                    setCurrentScreen('complete');
                  }
                  
                  playSound('click');
                  triggerHaptic('light');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-colors transform hover:scale-105 active:scale-95"
              >
                Got It! Continue →
              </button>
            </div>
          </div>
        </div>
      )}
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

