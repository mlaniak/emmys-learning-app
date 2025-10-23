import React, { useState } from 'react';
import PDFViewer from './PDFViewer';

const Week10Newsletter = ({ onViewPDF, onBack }) => {
  const [showPDF, setShowPDF] = useState(false);

  if (showPDF) {
    return (
      <PDFViewer
        pdfPath="/emmys-learning-app/newsletters/1st_grade_Newsletter_Week__10.pdf"
        title="Week 10 Newsletter - October 20th-24th"
        onBack={() => setShowPDF(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 font-sans rounded-3xl shadow-2xl">
        {/* Back Button */}
        <div onClick={() => {
          console.log('Week10Newsletter back button clicked');
          onBack();
        }} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-6">← Back to Newsletters</div>
        
        {/* Header */}
        <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">1st Grade Newsletter - Week 10</h1>
        <h2 className="text-xl text-gray-600">October 20th-24th</h2>
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
          <p className="mb-4">Welcome back to the 2nd term! Please check out the important events this week, and drop off your last candy donations. Also, we hope to see all students participate in the book character pumpkin contest (due Wednesday, 8 am) and stop by on Wednesday after school for our Literacy night, full of fun activities!</p>
          
          <p className="mb-4">Below are some tips to help your child have a successful back-to-school week:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Have your child complete daily homework</li>
            <li>Review the importance of respecting others and their personal space, including keeping their hands to themselves.</li>
            <li>Read the newsletter to become your child's supporter & understand when things are due</li>
          </ul>
          
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
            <li><span className="font-semibold">Oct 21-24:</span> Book Fair</li>
            <li><span className="font-semibold">Oct 21-Oct.22:</span> Bring Pumpkins to classroom</li>
            <li><span className="font-semibold">Oct 22:</span> Literacy Night 5:00-6:30 pm</li>
            <li><span className="font-semibold">Oct 24:</span> Wear Pink for Breast Cancer Awareness</li>
            <li><span className="font-semibold">Oct 24:</span> PTO Trunk or Treat 6:00-7:30</li>
            <li><span className="font-semibold">Oct 24:</span> Turkey information goes home</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">Check out all of the subjects below for assessment dates!</p>
        </div>
      </section>

      {/* QVE Newsletter Link */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">QVE NEWSLETTER</h3>
        <div className="bg-green-50 p-6 rounded-lg">
          <p className="mb-4">The October newsletter has tons of important information! click on the link.</p>
          <a href="https://app.smore.com/n/9tvrj" className="text-blue-600 underline font-semibold">
            Link: https://app.smore.com/n/9tvrj
          </a>
        </div>
      </section>

      {/* Highlight of the Week */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">HIGHLIGHT OF THE WEEK</h3>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Fort Bend Fair Artists!</h4>
          <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">
            [Images showing students holding up their artwork for the Fort Bend Fair]
          </div>
        </div>
      </section>

      {/* Week at a Glance */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">WEEK AT A GLANCE</h3>
        <div className="bg-orange-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">WEEK OF FUN EVENTS!</h4>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border-l-4 border-red-500">
              <h5 className="font-bold text-red-600">MONDAY</h5>
              <p>NO SCHOOL! GO TO BED EARLY</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-orange-500">
              <h5 className="font-bold text-orange-600">TUESDAY</h5>
              <p>BRING YOUR CANDY DONATIONS & PUMPKIN CHARACTER FOR THE CONTEST!</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-blue-500">
              <h5 className="font-bold text-blue-600">WEDNESDAY</h5>
              <p>OCT 22: LITERACY NIGHT 5:00-6:30 PM</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-green-500">
              <h5 className="font-bold text-green-600">THURSDAY</h5>
              <p>FIELD TRIP FORMS WILL COME HOME! PLEASE SIGN & RETURN ON FRIDAY!</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-purple-500">
              <h5 className="font-bold text-purple-600">FRIDAY</h5>
              <p>OCT 24: PTO TRUNK OR TREAT 6:00-7:30</p>
            </div>
          </div>
        </div>
      </section>

      {/* Book Fair Reminder */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">REMINDER</h3>
        <div className="bg-pink-50 p-6 rounded-lg">
          <p className="mb-4">The book fair begins this week. Please see below on how to add $ for your child and create an E-wallet account. Do not send cash!</p>
          <a href="https://bookfairs.scholastic.com/bf/quailvalleyelemschool" className="text-blue-600 underline font-semibold block mb-4">
            https://bookfairs.scholastic.com/bf/quailvalleyelemschool
          </a>
          <p className="mb-4">Students will shop during our class time, and parents can come during the literacy night from 4pm-6:20pm.</p>
          <p className="font-bold text-red-600">NO library books will be checked out with Mrs. Taylor due to the Book Fair! It will be a store this week, not a library!</p>
        </div>
      </section>

      {/* Scholastic Book Fair */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">SCHOLASTIC BOOK FAIR</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Create a Book Fair eWallet for cash-free shopping.</h4>
          <p className="mb-4">Convenient and secure, eWallet lets your child choose books they want to read.</p>
          <p className="mb-4">Plus, you can share your eWallet link so friends and family can help your child find even more to read. <span className="font-semibold">Unspent funds from a past Fair?</span> To transfer them to this Fair, log in to your Scholastic account and create a new eWallet—then your previous balance will be available to transfer as an eGift Card.</p>
          <p className="mb-4">When you fund an eWallet, you can also contribute to <span className="font-semibold">Share the Fair,</span> the giving program that <span className="font-semibold">benefits kids in your school</span> who need help buying new books.</p>
          
          <div className="bg-white p-4 rounded mb-4">
            <h5 className="font-bold mb-2">Process:</h5>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create account</li>
              <li>Add funds</li>
              <li>Share link</li>
              <li>Your child shops</li>
            </ol>
          </div>
          
          <p className="font-bold">Visit our school's Book Fair homepage to get started:</p>
          <a href="https://bookfairs.scholastic.com/bf/quailvalleyelemschool" className="text-blue-600 underline font-semibold">
            https://bookfairs.scholastic.com/bf/quailvalleyelemschool
          </a>
        </div>
      </section>

      {/* Homework Table */}
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
                <td className="border border-gray-300 p-3"><span className="font-semibold">Reading:</span> See homework packet for options!</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Math Review:</span> Check your folder! Do one section per day. Please return it by Friday.</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Tue</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Reading:</span> See homework packet for options!</td>
                <td className="border border-gray-300 p-3">See class dojo for any reviews or test reminders!</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Wed</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Reading:</span> See homework packet for options!</td>
                <td className="border border-gray-300 p-3">See class dojo for any reviews or test reminders!</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">Thu</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Reading:</span> See homework packet for options!</td>
                <td className="border border-gray-300 p-3">See class dojo for any reviews or test reminders!</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 font-semibold">Fri</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Reading:</span> See homework packet for options!</td>
                <td className="border border-gray-300 p-3"><span className="font-semibold">Homework DUE Today</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Learning This Week */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">LEARNING THIS WEEK</h3>
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Phonics: Diagraphs: ck, tch</h4>
            <p><span className="font-semibold">OCTOBER Sight word list (see the weekly homework) TEST on 10/31</span></p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Reading: Readers study characters</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Readers think about and describe characters</li>
              <li>Readers can infer and describe what the characters will do or say</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Writing: Composing Personal Narratives</h4>
            <p>Writers ONCE AGAIN write a new piece of personal narrative and will go through the writing process for the next 2 weeks.</p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Math Week 9: Comparing and Ordering numbers (0-99)</h4>
            <p className="font-semibold mb-2">First Grade Math Focus</p>
            <p className="mb-2">We are learning to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Show numbers up to 120 using objects, pictures, and expanded form.</li>
              <li>Build and break apart numbers into tens and ones in different ways.</li>
              <li>Compare numbers using words like greater than, less than, and equal to.</li>
              <li>Order numbers on a number line from least to greatest.</li>
              <li>Create new numbers that are greater or less than a given number.</li>
            </ul>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Science: Forces and Motion</h4>
            <p>Students will plan and conduct a descriptive investigation that predicts how pushes and pulls can start, stop, or change the speed or direction of an object's motion.</p>
          </div>
          
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Social Studies: Geography and Map Skills</h4>
            <p className="mb-2">Students will be diving into the world of maps.</p>
            <p className="mb-2">Here's what we'll be focusing on:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Understanding what maps are and why we use them.</li>
              <li>Identifying the different parts of a map.</li>
              <li>Learning how to read and use symbols found on maps.</li>
              <li>Creating our very own map of the classroom!</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Phonics Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">PHONICS</h3>
        <div className="bg-orange-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-2">Test on 10/31</h4>
          <p className="font-semibold mb-4">October spelling words</p>
          
          <div className="mb-4">
            <p className="font-semibold mb-2">Example of words with Ck, and tch digraphs:</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1 rounded border">click</span>
              <span className="bg-white px-3 py-1 rounded border">clock</span>
              <span className="bg-white px-3 py-1 rounded border">dock</span>
              <span className="bg-white px-3 py-1 rounded border">itch</span>
              <span className="bg-white px-3 py-1 rounded border">fetch</span>
            </div>
          </div>
          
          <div>
            <p className="font-semibold mb-2">October Spelling Words:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['Than', 'Think', 'Their', 'These', 'When', 'Each', 'Such', 'Me', 'Find', 'see'].map((word, index) => (
                <div key={index} className="bg-white p-2 rounded border text-center">
                  {index + 1}. {word}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reading Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">READING</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="mb-4">Readers will begin to study characters in fiction stories. They will learn what a dialogue is and describe the characters.</p>
          <p className="font-semibold italic">I infer the character will...because he/she said...</p>
        </div>
      </section>

      {/* I Can Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">I CAN</h3>
        <div className="bg-green-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">DESCRIBE CHARACTERS</h4>
          
          <div className="mb-4">
            <h5 className="font-semibold mb-2">Traits</h5>
            <p className="mb-2">Words to describe how a character acts, feels and reacts to other characters.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-white px-3 py-1 rounded border">sad</span>
              <span className="bg-white px-3 py-1 rounded border">happy</span>
              <span className="bg-white px-3 py-1 rounded border">lazy</span>
              <span className="bg-white px-3 py-1 rounded border">silly</span>
            </div>
          </div>
          
          <p className="mb-4">Have your child read a non-fiction story, identify the character, and describe the character.</p>
          
          <div className="bg-white p-4 rounded border">
            <h5 className="font-semibold mb-2">All About ____________</h5>
            <p className="text-sm text-gray-600 mb-2">by ____________</p>
            <p className="font-semibold">What did you learn about the character?</p>
          </div>
        </div>
      </section>

      {/* Writing Rubric */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">WRITING RUBRIC</h3>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Writing Rubric teachers will use for grading a piece of writing</h4>
          <p className="font-semibold mb-4">FBISD Grade 1 Writing Rubric</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Categories</th>
                  <th className="border border-gray-300 p-2 text-center">Developing (1)</th>
                  <th className="border border-gray-300 p-2 text-center">Progressing (2)</th>
                  <th className="border border-gray-300 p-2 text-center">Proficient (3)</th>
                  <th className="border border-gray-300 p-2 text-center">Advanced (4)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Content</td>
                  <td className="border border-gray-300 p-2 text-center">Basic</td>
                  <td className="border border-gray-300 p-2 text-center">Developing</td>
                  <td className="border border-gray-300 p-2 text-center">Good</td>
                  <td className="border border-gray-300 p-2 text-center">Excellent</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-2 font-semibold">Conventions</td>
                  <td className="border border-gray-300 p-2 text-center">Basic</td>
                  <td className="border border-gray-300 p-2 text-center">Developing</td>
                  <td className="border border-gray-300 p-2 text-center">Good</td>
                  <td className="border border-gray-300 p-2 text-center">Excellent</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h5 className="font-semibold mb-2">Grade Scale:</h5>
            <ul className="space-y-1">
              <li><span className="font-semibold">DV = 69 or below</span></li>
              <li><span className="font-semibold">PG = 70-89</span></li>
              <li><span className="font-semibold">PF = 90-100</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Personal Narrative */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">PERSONAL NARRATIVE</h3>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <p className="mb-4">Please see the writing rubric for <span className="font-semibold">Personal Narrative</span> that teachers will use for student's work</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left">Personal Narrative Success Criteria Checklist</th>
                  <th className="border border-gray-300 p-3 text-center">I still need help.</th>
                  <th className="border border-gray-300 p-3 text-center">I included this!</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3">I can: write a true story about myself</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-3">I can: write about one special moment</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3">I can: revise my writing to include adjectives</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-3">I can: revise my writing to include details</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3">I can: edit my writing</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                  <td className="border border-gray-300 p-3 text-center">☐</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Telling a Story Across My Fingers */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">TELLING A STORY ACROSS MY FINGERS</h3>
        <div className="bg-pink-50 p-6 rounded-lg">
          <p className="mb-4">Students will <span className="font-semibold">choose 1 TRUE story about themselves</span> and use this chart when drafting the words</p>
          
          <div className="bg-white p-4 rounded border">
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">T</div>
                <p className="text-sm font-semibold">Thumb:</p>
                <p className="text-xs">Where were you? When was it?</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                <p className="text-sm font-semibold">Index finger (First):</p>
                <p className="text-xs">What was the first thing that happened?</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                <p className="text-sm font-semibold">Middle finger (Then):</p>
                <p className="text-xs">Then what happened?</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                <p className="text-sm font-semibold">Ring finger (Last):</p>
                <p className="text-xs">What was the last thing that happened?</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mb-2">F</div>
                <p className="text-sm font-semibold">Pinky (Feelings):</p>
                <p className="text-xs">What did you think or feel just then?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Process */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">WRITING</h3>
        <div className="bg-indigo-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">The writing process</h4>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li>Pre-write (brainstorm ideas)</li>
            <li>Draft (write beginning, middle, end)</li>
            <li>Revise - what else can I add? details, adjectives</li>
            <li>Edit - look for my mistakes (capital letter, punctuation, sight words spelling, finger space)</li>
            <li>publish - I am an author! share & celebrate with others</li>
          </ol>
          
          <p className="mb-4">In 1st grade, writers will learn and work with the writing process all year long. This week I should be able to...</p>
          <p className="font-semibold">1) Think of an idea and choose a topic. Retell my idea using my 4-finger across my hands</p>
        </div>
      </section>

      {/* Math Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">MATH</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">🚀 Mrs. Gaines' First Grade Math News 🌟</h4>
          <p className="font-semibold mb-4">"Reach for the Stars: Explore, Discover, Innovate!"</p>
          
          <p className="mb-4">Our Math Common Formative Assessment (CFA) will take place on <span className="font-semibold">Thursday, October 9th.</span></p>
          
          <p className="mb-4">Students will see questions about:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Skip counting with coins</li>
            <li>Numeration (understanding tens and ones)</li>
            <li>Comparing and ordering numbers up to 99</li>
          </ul>
          
          <p className="mb-4">Please review past homework and the skills in this newsletter to help your child feel confident and prepared!</p>
          
          <div className="bg-white p-4 rounded border">
            <p className="font-semibold mb-2">Family Tip:</p>
            <p>Practice counting coins and ordering numbers together at home. Have your child tell which amount or number is greater, less, or equal while explaining how they know.</p>
          </div>
        </div>
      </section>

      {/* Math Goals */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">⭐ OUR MATH ⭐ GOALS</h3>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">📦</div>
              <p className="font-semibold">120</p>
              <p className="text-sm">Show numbers up to 120 with objects and pictures.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">🔢</div>
              <p className="font-semibold">Break numbers into tens and ones.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">&gt;=&lt;</div>
              <p className="font-semibold">Tell which number is greater, less, or equal.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">0——5——10</div>
              <p className="font-semibold">Put numbers in order on a number line.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">⬆less than⬇</div>
              <p className="font-semibold">Make a number that is greater than or less than another number</p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">SCIENCE</h3>
        <div className="bg-red-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">Forces and Motion</h4>
          
          <div className="mb-6">
            <h5 className="font-semibold text-lg mb-2">Forces:</h5>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded border">
                <h6 className="font-semibold mb-2">1) Push:</h6>
                <p className="text-sm mb-2">A force that points in a direction away from its source.</p>
                <div className="bg-gray-200 h-16 rounded flex items-center justify-center text-gray-500">
                  [Illustration of person pushing]
                </div>
              </div>
              <div className="bg-white p-4 rounded border">
                <h6 className="font-semibold mb-2">2) Pull:</h6>
                <p className="text-sm mb-2">A force that points in a direction toward the source.</p>
                <div className="bg-gray-200 h-16 rounded flex items-center justify-center text-gray-500">
                  [Illustration of person pulling]
                </div>
              </div>
            </div>
            
            <p className="mb-2">Pushes and pulls have <span className="font-semibold">direction</span>. They push or pull up ⬆, down ⬇, to the right ➡, to the left ⬅, away from you, or toward you.</p>
            <p className="mb-4">Pushes and pulls can be strong or weak.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-lg mb-2">Motion</h5>
            <p className="mb-2"><span className="font-semibold">Motion</span> is the change in position of an object over time.</p>
            
            <div className="bg-white p-4 rounded border mb-4">
              <div className="bg-gray-200 h-16 rounded flex items-center justify-center text-gray-500">
                [Diagram showing wagon moving from "Initial position" to "Final position"]
              </div>
            </div>
            
            <p className="mb-2"><span className="font-semibold">MOTION:</span></p>
            <p className="mb-2">Direction: to the right</p>
            <p className="mb-2">Front: back</p>
            
            <p className="mb-2">Motion has <span className="font-semibold">direction</span>. They push or pull up ⬆, down ⬇, to the right ➡, to the left ⬅, away from you, or toward you.</p>
            <p>Motion has <span className="font-semibold">speed</span>. Speed is how fast or slow an object moves.</p>
          </div>
        </div>
      </section>

      {/* Descriptive Investigation Components */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">DESCRIPTIVE INVESTIGATION COMPONENTS</h3>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">❓</div>
              <h5 className="font-semibold mb-2">1. Question</h5>
              <p className="text-sm">It is what we are investigating and learning about.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">🤔</div>
              <h5 className="font-semibold mb-2">2. Prediction</h5>
              <p className="text-sm">It is your thinking about the results of the investigation.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">📋</div>
              <h5 className="font-semibold mb-2">3. Materials</h5>
              <p className="text-sm">It is a list of all the objects needed to complete the investigation.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">✅</div>
              <h5 className="font-semibold mb-2">4. Procedure</h5>
              <p className="text-sm">It is a list of what you have to do to complete the investigation.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">📊</div>
              <h5 className="font-semibold mb-2">5. Data</h5>
              <p className="text-sm">It is the information you collect when completing an investigation.</p>
            </div>
            <div className="bg-white p-4 rounded border text-center">
              <div className="text-2xl mb-2">👨‍🏫</div>
              <h5 className="font-semibold mb-2">6. Conclusion</h5>
              <p className="text-sm">It is the answer to the question and includes what you learned.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Studies */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">SOCIAL STUDIES</h3>
        <div className="bg-indigo-50 p-6 rounded-lg">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🧭</div>
            <p className="font-semibold">Cardinal Directions</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-2">
                <li>• Globe</li>
                <li>• Map Legend</li>
                <li>• Symbol</li>
                <li>• Compass Rose</li>
              </ul>
            </div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">
              [Illustrations showing a globe and map examples]
            </div>
          </div>
        </div>
      </section>

      {/* Field Trip */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">FIELD TRIP</h3>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="text-center mb-4">
            <h4 className="text-2xl font-bold text-yellow-600 mb-2">WHERE:</h4>
            <h5 className="text-xl font-bold">CHILDREN'S MUSEUM: ECO STATION EXHIBIT</h5>
            
            <h4 className="text-2xl font-bold text-yellow-600 mb-2 mt-6">WHEN:</h4>
            <h5 className="text-xl font-bold">NOVEMBER 18, 2025</h5>
          </div>
          
          <p className="mb-4">Field trip forms will come home on Thursday! Please fill it up and return it on Friday. See the link below if you are interested in attending as your child's chaperone.</p>
          
          <a href="https://www.fortbendisd.com/Page/133013" className="text-blue-600 underline font-semibold block mb-4">
            https://www.fortbendisd.com/Page/133013
          </a>
          
          <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
            [School bus illustration with text "LET'S GO" and "ADVENTURE"]
          </div>
        </div>
      </section>

      {/* Field Trip Reminders */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">FIELD TRIP REMINDERS FOR NOVEMBER 18, 2025</h3>
        <div className="bg-red-50 p-6 rounded-lg">
          <p className="font-bold text-lg mb-4">FIRST GRADE WILL BE TAKING A FIELD TRIP TO THE CHILDREN'S MUSEUM (ECO EXHIBIT).</p>
          
          <div className="space-y-4">
            <p><span className="font-semibold">ALL STUDENTS MUST LEAVE AND RETURN FROM QVE FOR THE FIELD TRIP ON THE BUS.</span></p>
            
            <p><span className="font-semibold">EACH CHILD ATTENDING MUST RETURN A COMPLETED PERMISSION SLIP.</span> IF YOUR CHILD DOES NOT TURN IN THEIR PERMISSION SLIP, THEY WILL NOT BE ALLOWED TO ATTEND THE FIELD TRIP. PLEASE RETURN NO LATER THAN <span className="font-bold">NOVEMBER 10TH, 2025.</span></p>
            
            <p><span className="font-semibold">EACH STUDENT SHOULD WEAR A QVE SHIRT.</span> IF THEY DO NOT HAVE ONE, THEY CAN WEAR A NAVY BLUE T-SHIRT. ALSO, BE SURE THAT YOUR CHILD WEARS APPROPRIATE SHOES FOR BEING OUTSIDE FOR LUNCH, SUCH AS TENNIS SHOES.</p>
            
            <p><span className="font-semibold">IF YOUR CHILD IS NOT TAKING A SACK LUNCH FROM THE CAFETERIA, PLEASE SPECIFY IN THE FORM SENT BY THE TEACHER.</span> THERE WILL BE NO EXTRA LUNCHES IF ONE IS NOT REQUESTED.</p>
            
            <p><span className="font-semibold">IF YOU PACK A SACK LUNCH, THE LUNCH SHOULD BE IN A DISPOSABLE BAG.</span> THIS CAN BE A GALLON SIZE ZIPLOC BAG, OR GROCERY STORE BAG. EACH LUNCH BAG SHOULD BE LABELED WITH YOUR CHILD'S NAME. NO LUNCH KITS WILL BE ALLOWED. WE WILL THROW EVERYTHING AWAY BEFORE WE RETURN TO SCHOOL.</p>
            
            <p><span className="font-semibold">PLEASE ALSO PACK A QUICK SNACK FOR YOUR CHILD,</span> LIKE A BAG OF CHIPS AND A SMALL DRINK. THEY WILL EAT A SMALL SNACK RIGHT BEFORE WE RETURN TO SCHOOL.</p>
            
            <p><span className="font-semibold">SINCE THE STUDENTS WILL/MAY BE OUTSIDE FOR LUNCH,</span> YOU MAY WANT TO APPLY SUNSCREEN AT HOME AND GIVE ANY ALLERGY MEDICATIONS AT HOME, AS WELL.</p>
            
            <p><span className="font-semibold">PLEASE REMIND YOUR CHILD OF THE IMPORTANCE OF APPROPRIATE BEHAVIOR ON FIELD TRIPS.</span> TEACHERS MAY CONTACT YOU IF YOUR CHILD MUST HAVE AN ADULT WITH THEM DUE TO BEHAVIOR FOR THEIR SAFETY.</p>
            
            <p><span className="font-semibold">IF YOU HAVE ANY QUESTIONS, PLEASE REACH OUT TO YOUR 1ST GRADE TEACHER!</span></p>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-4xl">❓</div>
            <p className="font-bold">I HAVE A QUESTION</p>
          </div>
        </div>
      </section>

      {/* DreamBox Login */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">LOG IN TO DREAMBOX</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="mb-4">This year, 1st <span className="font-semibold">WILL not</span> use Math XL like grades 2-5th. We will be using Dreambox for math practice. See the instructions sent by our amazing parent, Mrs. Nguyen!</p>
          
          <h4 className="font-bold text-lg mb-4">Instructions:</h4>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li>https://www.fortbendisd.com/1link</li>
            <li>Login to 1Link</li>
              <li>Enter your child's email address (if you don't have it, you can look this up on Skyward &gt; Choose your Student &gt; Student Profile)</li>
            <li>Password: 123456</li>
            <li>Clever</li>
            <li>DreamBox Math</li>
          </ol>
          
          <p className="font-bold">Done ✅</p>
          
          <div className="bg-gray-200 h-16 rounded flex items-center justify-center text-gray-500 mt-4">
            [DreamBox Learning logo]
          </div>
        </div>
      </section>

      {/* Literacy Night */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">LITERACY NIGHT</h3>
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <h4 className="font-bold text-lg mb-2">QUAIL VALLEY ELEMENTARY</h4>
          <h5 className="text-2xl font-bold text-green-600 mb-4">Literacy Night</h5>
          <p className="font-bold mb-2">BOOK FAIR - CRAFTS- GAMES- FUN</p>
          <p className="font-bold text-lg mb-4">WEDNESDAY, OCTOBER 22</p>
          <p className="font-bold text-lg mb-4">5:00-6:30 PM</p>
          
          <p className="mb-4">Please <span className="font-semibold">Click here</span> or scan this QR Code to RSVP:</p>
          
          <div className="bg-gray-200 h-24 w-24 mx-auto rounded flex items-center justify-center text-gray-500 mb-4">
            [QR code shown]
          </div>
          
          <p className="font-bold text-lg">We hope to see everyone there!</p>
        </div>
      </section>

      {/* Standards-Based Grading */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">STANDARDS-BASED GRADING</h3>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">What is Standards-Based Grading?</h4>
          <p className="mb-4">Standards-based grading is a system where students receive feedback around "fixed targets" or competencies. Non-academic factors (participation, late assignments, etc.) are removed, so the final grade represents what the student knows and can do.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-lg mb-2">Standards-Based Grading</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Represents what the student knows and can do</li>
                <li>Focuses on what is learned by student</li>
                <li>Reflects recent evidence of learning</li>
                <li>Weaknesses and strengths are clear</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-lg mb-2">Grade Levels:</h5>
              <ul className="space-y-2">
                <li><span className="font-semibold">PF- Proficient:</span> I got it! I have mastered the content!</li>
                <li><span className="font-semibold">PG- Progressing:</span> I am almost there. I need some support with the skill.</li>
                <li><span className="font-semibold">DV- Developing:</span> I need additional class and home support. Urgent intervention is needed.</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="font-semibold text-lg mb-2">Benefits of Standards-Based Grading</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Learning is prioritized over compliance</li>
              <li>Growth mindset develops</li>
              <li>Motivation to learn increases</li>
              <li>Grades have meaning</li>
              <li>Student ownership of learning increases</li>
              <li>Multiple opportunities and ways to show learning</li>
              <li>Clear vision of success</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Grading Timeline */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">2025-2026 Elementary Grading Timeline</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Grading Period</th>
                <th className="border border-gray-300 p-2 text-left">Description</th>
                <th className="border border-gray-300 p-2 text-left">Start Date</th>
                <th className="border border-gray-300 p-2 text-left">End Date</th>
                <th className="border border-gray-300 p-2 text-left">Grading Window Open</th>
                <th className="border border-gray-300 p-2 text-left">Grading Window Closed</th>
                <th className="border border-gray-300 p-2 text-left">Post to Family Access</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">1</td>
                <td className="border border-gray-300 p-2">TERM 1</td>
                <td className="border border-gray-300 p-2">08/12/2025</td>
                <td className="border border-gray-300 p-2">10/10/2025</td>
                <td className="border border-gray-300 p-2">10/06/2025 12:01 am</td>
                <td className="border border-gray-300 p-2">10/12/2025 11:59 pm</td>
                <td className="border border-gray-300 p-2">10/23/2025 12-4:30 pm</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2">2</td>
                <td className="border border-gray-300 p-2">TERM 2</td>
                <td className="border border-gray-300 p-2">10/21/2025</td>
                <td className="border border-gray-300 p-2">12/19/2025</td>
                <td className="border border-gray-300 p-2">12/15/2025 12:01 am</td>
                <td className="border border-gray-300 p-2">12/19/2025 10:00 am</td>
                <td className="border border-gray-300 p-2">12/19/2025 12-4:30 pm</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">3</td>
                <td className="border border-gray-300 p-2">TERM 3</td>
                <td className="border border-gray-300 p-2">01/08/2026</td>
                <td className="border border-gray-300 p-2">03/13/2026</td>
                <td className="border border-gray-300 p-2">03/09/2026 12:01 am</td>
                <td className="border border-gray-300 p-2">3/15/2026 11:59 pm</td>
                <td className="border border-gray-300 p-2">03/24/2026 12-4:30 pm</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2">4</td>
                <td className="border border-gray-300 p-2">TERM 4</td>
                <td className="border border-gray-300 p-2">03/23/2026</td>
                <td className="border border-gray-300 p-2">05/28/2026</td>
                <td className="border border-gray-300 p-2">05/21/2026 12:01 am</td>
                <td className="border border-gray-300 p-2">05/28/2026 10:00 am</td>
                <td className="border border-gray-300 p-2">05/28/2026 12-4:30 pm</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <p className="font-bold text-lg">Attending daily to class and student ownership make a successful learner.</p>
        </div>
      </section>

      {/* Intervention/Enrichment Tips */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">SPELLING INTERVENTION/ENRICHMENT TIPS @ HOME</h3>
        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">DV: Developing 69 or below</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Practice Letter name and sounds for uppercase and lower case with flashcards.</li>
              <li>Make and practice flash cards with high frequency words.</li>
              <li>Build words with letter tiles.</li>
              <li>Sentence dictation using spelling words. Students copy sentence with focus on proper lower case, capital letters, and punctuation.</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">PG: Progressing 70-89</h4>
            <p className="mb-2">1. Elkonin boxes/stairstep spelling</p>
            <div className="bg-white p-4 rounded border">
              <div className="flex items-end space-x-1">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">w</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">w</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">e</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">w</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">e</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">l</div>
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">l</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">PF: Proficient 90-100</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Write sentences using spelling words.</li>
              <li>Alphabetize spelling words.</li>
              <li>Create a scrabble spelling code.</li>
            </ol>
            
            <div className="mt-4">
              <p className="font-semibold mb-2">Bonus October Words:</p>
              <div className="flex flex-wrap gap-2">
                {['unique', 'because', 'autumn', 'investigation', 'pumpkin', 'festival'].map((word, index) => (
                  <span key={index} className="bg-white px-3 py-1 rounded border">{index + 1}. {word}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Math Intervention Tips */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">MATH: COINS INTERVENTION/ENRICHMENT TIPS @ HOME</h3>
        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">DV: Developing 69 or below</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Write numbers 1-100</li>
              <li>Count forward and backwards from a given number.</li>
              <li>Hold up your finger to identify how many fingers without counting. (recognizing numbers to 10). Then ask them how many more to make ten (making 10).</li>
              <li>Sort and identify coins</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">PG: Progressing 70-89</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Orally skip count by 10's, 5's, and 2's to 40</li>
              <li>Count on from a given number.</li>
              <li>Rewards and chores using coins.</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-bold text-lg mb-4">PF: Proficient 90-100</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Orally and write skip count by 10's, 5's, 2's to 100.</li>
              <li>Skip count by 10's start at a given number and then 5's, then 1's (ex: coins; dime, dime, dime, nickel, nickel, penny, penny). 10, 20, 30, 35, 40, 45, 46, 47).</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Additional Homework */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">IF YOU NEED MORE HOMEWORK...PLEASE COMPLETE THESE ADDITIONAL TASKS...THESE ARE OPTIONAL!</h3>
        <div className="bg-orange-50 p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-4">WRITING INTERVENTION/ENRICHMENT TIPS @ HOME</h4>
          
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-bold text-lg mb-2">DV: Developing 69 or below</h5>
              <ol className="list-decimal list-inside space-y-2">
                <li>Student write 1 sentence about your day and draw a picture.</li>
                <li>Parents rewrite the sentence for student to copy. Focus on copying with correct letter formation, finger spacing, lowercase and capital letter, and punctuation.</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h5 className="font-bold text-lg mb-2">PG: Progressing 70-89</h5>
              <p>1. Write 1-2 sentences about your day and draw a picture.</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-bold text-lg mb-2">PF: Proficient 90-100</h5>
              <ol className="list-decimal list-inside space-y-2">
                <li>Write 3 or more sentences and draw a picture.</li>
                <li>Use checklist to self edit.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Birthday Reminder */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">Birthday Reminder</h3>
        <div className="bg-pink-50 p-6 rounded-lg">
          <p className="mb-4"><span className="font-semibold">Please notify your homeroom teacher when your child will bring birthday cupcakes to school. This ensures time is reserved for that event.</span></p>
          
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-bold text-lg">Birthday Treats</h4>
          </div>
          
          <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500 mb-4">
            [Image of party favors and treats]
          </div>
          
          <p className="mb-4">Due to the time constraints, we are <span className="font-bold">NOT</span> allowing treat bags and juices for birthday celebrations. Thank you for your understanding.</p>
          
          <div className="bg-gray-200 h-16 rounded flex items-center justify-center text-gray-500 mb-4">
            [Images showing prohibited juice boxes and water bottles]
          </div>
          
          <div className="text-center">
            <h4 className="font-bold text-2xl text-pink-600">Thanks For Your Support</h4>
          </div>
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

export default Week10Newsletter;
