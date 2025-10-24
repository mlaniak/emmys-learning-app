import React from 'react';

const NewsletterSelector = ({ onSelectNewsletter, onBack }) => {
  const newsletters = [
    {
      week: 10,
      title: "Week 10 Newsletter",
      date: "October 20th-24th", 
      description: "First Grade Newsletter - Week 10",
      icon: "📰",
      pdfPath: "/newsletters/1st_grade_Newsletter_Week__10.pdf"
    },
    {
      week: 9,
      title: "Week 9 Newsletter", 
      date: "October 13th-17th",
      description: "First Grade Newsletter - Week 9",
      icon: "📰",
      pdfPath: "/newsletters/1st_grade_Newsletter_week__9.pdf"
    },
    {
      week: 8,
      title: "Week 8 Newsletter",
      date: "October 6th-10th",
      description: "First Grade Newsletter - Week 8",
      icon: "📰",
      pdfPath: "/newsletters/1st_Grade_Newsletter_week__8.pdf"
    }
  ];

  const handleNewsletterClick = (newsletter) => {
    // Open PDF directly in a new tab
    window.open(newsletter.pdfPath, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div onClick={onBack} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-6">← Back</div>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">📰 Newsletter Archive</h1>
          <p className="text-lg text-gray-600">Click on a newsletter to open the PDF document</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {newsletters.map((newsletter) => (
            <div
              key={newsletter.week}
              onClick={() => handleNewsletterClick(newsletter)}
              className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 cursor-pointer transition-transform border-2 border-transparent hover:border-blue-300"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{newsletter.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{newsletter.title}</h3>
                <p className="text-blue-600 font-semibold mb-2">{newsletter.date}</p>
                <p className="text-gray-600 text-sm">{newsletter.description}</p>
                
                <div className="mt-4">
                  <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Open PDF →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">📚 About the Newsletters</h3>
            <p className="text-gray-600">
              Each newsletter contains important information about your child's learning, 
              upcoming events, homework assignments, and tips for parents to support 
              their first grader's education.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSelector;
