import React, { useState } from 'react';
import PDFViewer from './PDFViewer';

const Week8Newsletter = () => {
  const [showPDF, setShowPDF] = useState(false);

  if (showPDF) {
    return (
      <PDFViewer
        pdfPath="/emmys-learning-app/newsletters/1st_Grade_Newsletter_week__8.pdf"
        title="Week 8 Newsletter - October 6th-10th"
        onBack={() => setShowPDF(false)}
      />
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">1st Grade Newsletter - Week 8</h1>
        <h2 className="text-xl text-gray-600">October 6th-10th</h2>
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

      {/* Message from Teachers */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">A MESSAGE FROM YOUR TEACHERS</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="mb-4">Hello Parents,</p>
          <p className="mb-4">Welcome to Week 8! We're excited to continue our learning journey together. This week brings new challenges and opportunities for growth.</p>
          <p className="mb-4">Please ensure your child completes their daily homework and continues to practice reading at home. Your support makes all the difference!</p>
          <p className="font-semibold">Thank you!</p>
          <p className="font-semibold">-1st Grade Teachers</p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">CONTACT INFO</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg">Mrs. Colbert (Team Lead/ELA)</h4>
            <p className="text-blue-600">Yolanda.colbert@fortbendisd.gov</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg">Mrs. Gaines (Math/Science)</h4>
            <p className="text-blue-600">Stephanie.Gaines@fortbendisd.gov</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg">Mrs. Tea (Self Contained)</h4>
            <p className="text-blue-600">Stacy.Tea@fortbendisd.gov</p>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">IMPORTANT DATES</h3>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Important Dates:</h4>
          <ul className="space-y-2">
            <li><span className="font-semibold">Oct 6-10:</span> Regular school week</li>
            <li><span className="font-semibold">Oct 8:</span> Picture Day</li>
            <li><span className="font-semibold">Oct 10:</span> Early Release Day</li>
            <li><span className="font-semibold">Oct 11:</span> No School - Teacher Work Day</li>
          </ul>
        </div>
      </section>

      {/* Learning This Week */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">LEARNING THIS WEEK</h3>
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Phonics: Short Vowels</h4>
            <p>Students will continue practicing short vowel sounds and blending CVC words.</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Reading: Story Elements</h4>
            <p>Readers will identify characters, setting, and main events in stories.</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Writing: Personal Narratives</h4>
            <p>Writers will continue developing personal narrative writing skills.</p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Math: Numbers 0-20</h4>
            <p>Students will work with numbers 0-20, counting, and basic addition.</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Science: Weather and Seasons</h4>
            <p>Students will observe and describe weather patterns and seasonal changes.</p>
          </div>
        </div>
      </section>

      {/* Homework */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">HOMEWORK</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left">Day</th>
                <th className="border border-gray-300 p-3 text-left">ELA & Social Studies</th>
                <th className="border border-gray-300 p-3 text-left">Math & Science</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Mon</td>
                <td className="border border-gray-300 p-3">Reading practice - 15 minutes</td>
                <td className="border border-gray-300 p-3">Math worksheet - Numbers 1-10</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Tue</td>
                <td className="border border-gray-300 p-3">Sight word practice</td>
                <td className="border border-gray-300 p-3">Counting practice</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Wed</td>
                <td className="border border-gray-300 p-3">Reading practice - 15 minutes</td>
                <td className="border border-gray-300 p-3">Math worksheet</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Thu</td>
                <td className="border border-gray-300 p-3">Sight word practice</td>
                <td className="border border-gray-300 p-3">Number recognition</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Fri</td>
                <td className="border border-gray-300 p-3">Reading practice - 15 minutes</td>
                <td className="border border-gray-300 p-3">Math review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Reminders */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">REMINDERS</h3>
        <div className="bg-pink-50 p-6 rounded-lg">
          <ul className="space-y-2">
            <li>• Please ensure your child brings their homework folder daily</li>
            <li>• Reading at home for 15-20 minutes each night</li>
            <li>• Check your child's folder for important papers</li>
            <li>• Contact teachers with any questions or concerns</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
        <p>Week 8 Newsletter - October 6th-10th</p>
      </div>
    </div>
  );
};

export default Week8Newsletter;
