import React, { useState } from 'react';
import PDFViewer from './PDFViewer';

const Week9Newsletter = ({ onBack }) => {
  const [showPDF, setShowPDF] = useState(false);

  if (showPDF) {
    return (
      <PDFViewer
        pdfPath="/emmys-learning-app/newsletters/1st_grade_Newsletter_week__9.pdf"
        title="Week 9 Newsletter - October 13th-17th"
        onBack={() => setShowPDF(false)}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 font-sans rounded-3xl shadow-2xl">
        {/* Back Button */}
        <div onClick={() => {
          console.log('Week9Newsletter back button clicked');
          onBack();
        }} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-6">← Back to Newsletters</div>
        
        {/* Header */}
        <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">1st Grade Newsletter - Week 9</h1>
        <h2 className="text-xl text-gray-600">October 13th-17th</h2>
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
          <p className="mb-4">We're excited to share the progress your children are making! This week we're focusing on building strong foundations in reading and math.</p>
          <p className="mb-4">Please continue to support your child's learning at home. Daily reading practice and homework completion are essential for success.</p>
          <p className="font-semibold">Thank you for your continued support!</p>
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
            <li><span className="font-semibold">Oct 13-17:</span> Regular school week</li>
            <li><span className="font-semibold">Oct 15:</span> Fall Festival Planning Meeting</li>
            <li><span className="font-semibold">Oct 17:</span> Progress Reports Go Home</li>
            <li><span className="font-semibold">Oct 18:</span> No School - Teacher Work Day</li>
          </ul>
        </div>
      </section>

      {/* Learning This Week */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">LEARNING THIS WEEK</h3>
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Phonics: Consonant Blends</h4>
            <p>Students will practice blending consonant sounds (bl, cl, fl, gl, pl, sl).</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Reading: Main Idea and Details</h4>
            <p>Readers will identify the main idea and supporting details in informational texts.</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Writing: Opinion Writing</h4>
            <p>Writers will express their opinions and provide reasons to support their thinking.</p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Math: Addition and Subtraction</h4>
            <p>Students will solve addition and subtraction problems within 20.</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Science: Living and Non-living Things</h4>
            <p>Students will classify objects as living or non-living and explain their reasoning.</p>
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
                <td className="border border-gray-300 p-3">Reading practice - 20 minutes</td>
                <td className="border border-gray-300 p-3">Addition worksheet</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Tue</td>
                <td className="border border-gray-300 p-3">Consonant blend practice</td>
                <td className="border border-gray-300 p-3">Math facts practice</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Wed</td>
                <td className="border border-gray-300 p-3">Reading practice - 20 minutes</td>
                <td className="border border-gray-300 p-3">Subtraction worksheet</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Thu</td>
                <td className="border border-gray-300 p-3">Sight word practice</td>
                <td className="border border-gray-300 p-3">Number bonds practice</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Fri</td>
                <td className="border border-gray-300 p-3">Reading practice - 20 minutes</td>
                <td className="border border-gray-300 p-3">Math review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Spelling Words */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">SPELLING WORDS</h3>
        <div className="bg-orange-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Week 9 Spelling Words</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['blend', 'clap', 'flag', 'glad', 'plan', 'slip', 'black', 'clock', 'glass', 'plant'].map((word, index) => (
              <div key={index} className="bg-white p-2 rounded border text-center">
                {index + 1}. {word}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Math Focus */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">MATH FOCUS</h3>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Addition and Subtraction Strategies</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold mb-2">Addition Strategies:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Counting on</li>
                <li>Using number bonds</li>
                <li>Making ten</li>
                <li>Doubles facts</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Subtraction Strategies:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Counting back</li>
                <li>Using related facts</li>
                <li>Taking away</li>
                <li>Finding the difference</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reminders */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">REMINDERS</h3>
        <div className="bg-pink-50 p-6 rounded-lg">
          <ul className="space-y-2">
            <li>• Progress reports will be sent home on Friday</li>
            <li>• Continue daily reading practice at home</li>
            <li>• Practice math facts for 10 minutes each night</li>
            <li>• Check your child's folder for completed work</li>
            <li>• Contact teachers with any questions or concerns</li>
          </ul>
        </div>
      </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
          <p>Week 9 Newsletter - October 13th-17th</p>
        </div>
      </div>
    </div>
  );
};

export default Week9Newsletter;
