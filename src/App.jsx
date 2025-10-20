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

  const phonicsQuestions = [
    { word: 'then', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '⏰' },
    { word: 'when', question: 'Does this word have WH or TH?', options: ['WH', 'TH'], correct: 'WH', image: '🕐' },
    { word: 'think', question: 'Does this word have TH or SH?', options: ['TH', 'SH'], correct: 'TH', image: '🧠' },
    { word: 'show', question: 'Does this word have SH or TH?', options: ['SH', 'TH'], correct: 'SH', image: '👁️' },
    { word: 'chair', question: 'Does this word have CH or SH?', options: ['CH', 'SH'], correct: 'CH', image: '🪑' },
    { word: 'phone', question: 'Does this word have PH or F?', options: ['PH', 'F'], correct: 'PH', image: '📞' },
    { word: 'duck', question: 'Does this word have CK or K?', options: ['CK', 'K'], correct: 'CK', image: '🦆' },
    { word: 'ship', question: 'Does this word have SH or CH?', options: ['SH', 'CH'], correct: 'SH', image: '🚢' },
    { word: 'whip', question: 'Does this word have WH or W?', options: ['WH', 'W'], correct: 'WH', image: '🥊' },
    { word: 'thick', question: 'Does this word have TH or T?', options: ['TH', 'T'], correct: 'TH', image: '📚' }
  ];

  const mathQuestions = [
    { question: 'Which number is GREATER?', options: ['47', '52'], correct: '52', emoji: '🔢' },
    { question: 'How many tens in 45?', options: ['4', '5'], correct: '4', emoji: '🎯' },
    { question: 'Which is greater: 67 or 76?', options: ['67', '76'], correct: '76', emoji: '🔢' },
    { question: 'What is 5 + 3?', options: ['7', '8'], correct: '8', emoji: '➕' },
    { question: 'What is 12 - 4?', options: ['7', '8'], correct: '8', emoji: '➖' },
    { question: 'How many ones in 23?', options: ['2', '3'], correct: '3', emoji: '🎯' },
    { question: 'Which is smaller: 34 or 43?', options: ['34', '43'], correct: '34', emoji: '🔢' },
    { question: 'What is 6 + 7?', options: ['12', '13'], correct: '13', emoji: '➕' },
    { question: 'What is 15 - 8?', options: ['6', '7'], correct: '7', emoji: '➖' },
    { question: 'How many tens in 78?', options: ['7', '8'], correct: '7', emoji: '🎯' }
  ];

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

  const studyGuides = {
    phonics: { title: 'Phonics Guide', icon: '📚', sections: [{ heading: 'TH, WH, SH, CH, PH, CK Sounds', items: ['then, when, think, show, chair, phone, duck, ship, whip, thick'] }] },
    math: { title: 'Math Guide', icon: '🔢', sections: [{ heading: 'Place Value & Addition/Subtraction', items: ['Tens = groups of 10', '45 = 4 tens and 5 ones', 'Practice: 5+3=8, 12-4=8'] }] },
    reading: { title: 'Reading Guide', icon: '📖', sections: [{ heading: 'Story Elements', items: ['👥 Characters - WHO is in the story', '🏠 Setting - WHERE and WHEN', '😰 Problem - WHAT goes wrong', '✅ Solution - HOW it gets fixed'] }] },
    science: { title: 'Science Guide', icon: '🔬', sections: [{ heading: 'Systems, Plants, Animals, Weather', items: ['Systems have parts that work together', 'Plants need sunlight to grow', 'Animals need food to survive', 'Water freezes when cold'] }] },
    social: { title: 'Citizenship', icon: '🌟', sections: [{ heading: 'Good Citizenship', items: ['Be respectful and kind', 'Help others who need it', 'Keep community clean', 'Listen when others speak'] }] }
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

  useEffect(() => {
    canvasRefs.forEach((ref) => {
      if (ref.current) {
        const ctx = ref.current.getContext('2d');
        ctx.strokeStyle = drawColor; ctx.lineWidth = 3;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      }
    });
  }, [currentScreen, drawColor]);

  const startDrawing = (e, idx) => {
    const canvas = canvasRefs[idx].current;
    if (!canvas) return;
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
    canvas.getContext('2d').lineTo(x, y);
    canvas.getContext('2d').stroke();
  };

  const clearCanvas = (idx) => {
    const canvas = canvasRefs[idx].current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAnswer = (sel, cor, qs, explanation) => {
    const ok = sel === cor;
    if (ok) { 
      setScore(score + 10); 
      playSound('correct');
      setShowFeedback('correct'); 
      setAnswerAnimation('correct-bounce');
    } else { 
      playSound('incorrect');
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
        playSound('complete');
        setCurrentScreen('complete');
      }
    }, explanation && !ok ? 3500 : 1500);
  };

  const resetGame = () => { setCurrentQuestion(0); setScore(0); setCurrentScreen('home'); };

  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2">✨ Emmy's Learning Adventure ✨</h1>
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-2xl md:text-3xl font-bold text-purple-700">🏆 {score}</span>
              {score > 0 && <div onClick={() => { playSound('click'); resetGame(); }} className="px-4 py-2 bg-red-500 text-white rounded-full font-bold cursor-pointer hover:bg-red-600">Reset</div>}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-4">📚 Study Guides</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.keys(studyGuides).map(type => (
                <div key={type} onClick={() => { playSound('click'); setCurrentScreen(`guide-${type}`); }} 
                  className="bg-gradient-to-br from-pink-300 to-pink-500 p-4 rounded-2xl shadow-xl hover:scale-105 cursor-pointer text-center">
                  <div className="text-3xl mb-1">{studyGuides[type].icon}</div>
                  <h3 className="text-xs md:text-sm font-bold text-white">{studyGuides[type].title}</h3>
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
              { name: 'skipcounting', title: 'Skip Count', icon: '🔢', color: 'from-indigo-400 to-indigo-600' }
            ].map(game => (
              <div key={game.name} onClick={() => { playSound('click'); setCurrentScreen(game.name); setCurrentQuestion(0); }}
                className={`bg-gradient-to-br ${game.color} p-6 rounded-3xl shadow-2xl hover:scale-105 cursor-pointer text-center`}>
                <div className="text-4xl md:text-5xl mb-2">{game.icon}</div>
                <h2 className="text-lg md:text-xl font-bold text-white">{game.title}</h2>
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
                <div key={color.value} onClick={() => setDrawColor(color.value)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer hover:scale-110 ${drawColor === color.value ? 'ring-4 ring-yellow-400' : ''}`}
                  style={{ backgroundColor: color.value }} />
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
                    <div onClick={() => clearCanvas(i)} className="ml-auto px-3 py-1 bg-red-400 text-white rounded-full text-sm font-bold cursor-pointer hover:bg-red-500">Clear</div>
                  </div>
                  <canvas ref={canvasRefs[i]} width={600} height={80}
                    onMouseDown={(e) => startDrawing(e, i)} onMouseMove={(e) => draw(e, i)} 
                    onMouseUp={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    onTouchStart={(e) => startDrawing(e, i)} onTouchMove={(e) => draw(e, i)} 
                    onTouchEnd={() => { setIsDrawing(false); setCurrentCanvas(null); }}
                    className="w-full border-4 border-dashed border-purple-300 rounded-xl bg-white cursor-crosshair"
                    style={{touchAction: 'none'}} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-4">
            <div onClick={() => { if(currentQuestion>0) setCurrentQuestion(currentQuestion-1); }} 
              className={`px-6 py-3 font-bold bg-gray-300 rounded-full cursor-pointer ${currentQuestion===0?'opacity-50':''}`}>← Prev</div>
            <div onClick={() => { if(currentQuestion<spellingWords.length-1) setCurrentQuestion(currentQuestion+1); else setCurrentScreen('home'); }} 
              className="px-6 py-3 font-bold bg-purple-500 text-white rounded-full cursor-pointer">
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

  const questionSets = {
    phonics: phonicsQuestions, math: mathQuestions, reading: readingQuestions,
    science: scienceQuestions, social: socialStudiesQuestions, skipcounting: skipCountingQuestions
  };
  const qs = questionSets[currentScreen] || [];
  const q = qs[currentQuestion] || {};
  const bgColors = {
    phonics: 'from-pink-200 to-pink-400', math: 'from-blue-200 to-blue-400',
    reading: 'from-green-200 to-green-400', science: 'from-teal-200 to-teal-400',
    social: 'from-orange-200 to-orange-400', skipcounting: 'from-indigo-200 to-indigo-400'
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
            <div key={i} onClick={() => handleAnswer(opt, q.correct || q.answer, qs, q.explanation)} 
              className="p-6 md:p-8 text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:scale-110 cursor-pointer bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900">
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
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
      `}</style>
    </div>
  );
};

export default EmmyStudyGame;

