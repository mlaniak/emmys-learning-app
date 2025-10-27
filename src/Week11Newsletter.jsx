import React, { useState } from 'react';
import PDFViewer from './PDFViewer';

const Week11Newsletter = ({ onViewPDF, onBack }) => {
  const [showPDF, setShowPDF] = useState(false);

  if (showPDF) {
    return (
      <PDFViewer
        pdfPath="/emmys-learning-app/newsletters/1st_Grade_Newsletter_Week__11.pdf"
        title="Week 11 Newsletter"
        onBack={() => setShowPDF(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 font-sans rounded-3xl shadow-2xl">
        {/* Back Button */}
        <div onClick={onBack} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-6">← Back to Newsletters</div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">1st Grade Newsletter - Week 11</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
          
          {/* PDF View Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowPDF(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-lg hover:shadow-xl"
            >
              📄 View Original PDF
            </button>
          </div>
        </div>

        {/* Placeholder Content */}
        <section className="mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Week 11 Newsletter</h3>
            <p className="mb-4">Click the button above to view the complete Week 11 newsletter in PDF format.</p>
            <p className="text-gray-600">The newsletter contains important information about your child's learning, upcoming events, and homework assignments.</p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
          <p>End of Newsletter</p>
        </div>
      </div>
    </div>
  );
};

export default Week11Newsletter;

