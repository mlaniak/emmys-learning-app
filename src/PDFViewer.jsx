import React, { useState } from 'react';

const PDFViewer = ({ pdfPath, onBack, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError('Failed to load PDF. Please check if the file exists.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div onClick={onBack} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer">
            ← Back to Newsletter
          </div>
          <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
        </div>

        {/* PDF Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-700 mb-4">PDF Not Available</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700">
                  The PDF content has been implemented as interactive React components above. 
                  Use the "Back to Newsletter" button to return to the full newsletter view.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={pdfPath}
                className="w-full h-screen min-h-[800px]"
                title={title}
                onLoad={handleLoad}
                onError={handleError}
                style={{ border: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600">
              <span className="font-semibold">Tip:</span> Use the browser's zoom controls to adjust the PDF size for better readability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
