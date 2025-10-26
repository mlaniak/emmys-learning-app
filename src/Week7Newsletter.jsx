import React from 'react';

const Week7Newsletter = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📰</div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
            Week 7 Newsletter
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6">
            First Grade Learning Adventures
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 rounded-2xl border-4 border-blue-300 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-6 text-center">
            📚 This Week's Learning Highlights
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-blue-700 mb-3">🎯 Phonics Focus</h3>
              <p className="text-gray-700">
                This week we're exploring new sounds and letter combinations. Practice makes perfect!
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-blue-700 mb-3">🔢 Math Adventures</h3>
              <p className="text-gray-700">
                Numbers and counting are getting more exciting! Let's practice together.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-blue-700 mb-3">📖 Reading Time</h3>
              <p className="text-gray-700">
                New stories and words to discover! Reading opens up amazing worlds.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl text-white mb-6">
            <h3 className="text-2xl font-bold mb-4">📄 Full Newsletter</h3>
            <p className="text-lg mb-4">
              Click below to view the complete Week 7 newsletter with all the details!
            </p>
            <a
              href="/newsletters/1st_Grade_Newsletter_week__7.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              📖 View Week 7 Newsletter
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block bg-gray-500 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-600 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default Week7Newsletter;
