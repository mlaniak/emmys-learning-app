# ✨ Emmy's Learning Adventure

An interactive educational game designed to make learning fun and engaging for young students. Built with React, Vite, and Tailwind CSS.

## 🎮 Live Demo

**[Play Emmy's Learning Adventure](https://mlaniak.github.io/emmys-learning-app)**

## 🌟 Features

### 📚 **Educational Games**
- **Phonics** - Learn TH, WH, SH, CH, PH, and CK sounds with 10 interactive questions
- **Math** - Practice place value, addition, subtraction, and number comparison (10 questions)
- **Reading** - Understand story elements like characters, setting, problem, and solution (8 questions)
- **Spelling** - Interactive drawing practice with rainbow colors (10 words)
- **Science** - Explore systems, plants, animals, and weather concepts (7 questions)
- **Citizenship** - Learn about being a good citizen and community (7 questions)
- **Skip Counting** - Practice counting by 2s, 5s, and 10s (9 questions)

### 🎵 **Enhanced Audio Experience**
- **Correct answers** - Happy ascending chord sounds
- **Incorrect answers** - Gentle feedback tones
- **Button clicks** - Satisfying click sounds
- **Game completion** - Victory fanfare celebration

### 📱 **Responsive Design**
- Works perfectly on desktop, tablet, and mobile devices
- Touch-friendly drawing interface for spelling practice
- Beautiful gradient backgrounds and animations
- Smooth transitions and hover effects

### 📖 **Study Guides**
- Comprehensive guides for each subject
- Visual learning aids with emojis and examples
- Easy navigation between study and practice modes

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mlaniak/emmys-learning-app.git
   cd emmys-learning-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run start` - Start the app

## 🎯 How to Play

1. **Choose a Study Guide** - Click on any subject to learn the concepts
2. **Practice with Games** - Test your knowledge with interactive questions
3. **Spelling Practice** - Use the drawing canvas to write words 5 times
4. **Track Your Score** - Earn points for correct answers
5. **Complete All Subjects** - Master all areas of learning!

## 🛠️ Built With

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **HTML5 Canvas** - Interactive drawing for spelling
- **Web Audio API** - Sound effects and music

## 📁 Project Structure

```
emmys-learning-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind CSS imports
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Pages deployment
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🎨 Customization

### Adding New Questions
Edit the question arrays in `src/App.jsx`:
- `phonicsQuestions`
- `mathQuestions`
- `readingQuestions`
- `scienceQuestions`
- `socialStudiesQuestions`
- `skipCountingQuestions`
- `spellingWords`

### Modifying Study Guides
Update the `studyGuides` object in `src/App.jsx` to change content and structure.

### Styling Changes
The app uses Tailwind CSS classes. Modify the className attributes to change appearance.

## 🚀 Deployment

This app is automatically deployed to GitHub Pages on every push to the main branch.

**Live URL:** https://mlaniak.github.io/emmys-learning-app

> **Note:** If you see a 404 error, the deployment may still be in progress. Check the Actions tab for the latest deployment status.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mike Laniak**
- GitHub: [@mlaniak](https://github.com/mlaniak)

## 🙏 Acknowledgments

- Built with love for Emmy's learning journey
- Inspired by interactive educational games
- Thanks to the React and Tailwind CSS communities

## 📊 Stats

- **60+ Educational Questions** across 7 subjects
- **Interactive Drawing** for spelling practice
- **Responsive Design** for all devices
- **Enhanced Audio** for better engagement
- **Study Guides** for comprehensive learning

---

**Made with ❤️ for young learners everywhere!**
