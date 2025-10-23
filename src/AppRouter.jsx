import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewsletterPage from './pages/NewsletterPage';
import ParentReferencePage from './pages/ParentReferencePage';
import SpellingPage from './pages/SpellingPage';
import AchievementsPage from './pages/AchievementsPage';
import ProgressPage from './pages/ProgressPage';
import CustomizePage from './pages/CustomizePage';
import FeedbackPage from './pages/FeedbackPage';

const AppRouter = () => {
  return (
    <BrowserRouter basename="/emmys-learning-app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/newsletter/:week" element={<NewsletterPage />} />
        <Route path="/parent-reference" element={<ParentReferencePage />} />
        <Route path="/spelling" element={<SpellingPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/customize" element={<CustomizePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
