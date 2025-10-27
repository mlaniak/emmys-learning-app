import React from 'react';

const FieldTrips = ({ onBack }) => {
  const fieldTrips = [
    {
      id: 1,
      title: "Children's Museum of Houston",
      date: "November 18, 2025",
      time: "9:00 AM - 2:00 PM",
      location: "Children's Museum of Houston",
      address: "1500 Binz Street, Houston, TX 77004",
      description: "The 1st Grade students are taking a field trip to the Children's Museum of Houston.",
      dressCode: "QVE field trip shirt (or navy-blue shirt if you don't have one)",
      lunch: "Sack lunch required",
      notes: [
        "All students must be transported by the school bus to the field trip location",
        "Students and staff members only - Parents are not allowed to ride the bus",
        "If parents want to take their children home early, they must sign them out and pick them up from school",
        "Students are not required to bring money for this field trip",
        "This field trip is for grade level students only - NO siblings"
      ],
      permissionRequired: true,
      chaperoneInfo: "If you would like to be a chaperone, please contact your student's teacher. A criminal background check must be on file for all chaperones/volunteers through FBISD."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div onClick={onBack} className="bg-white px-6 py-3 rounded-full shadow-lg inline-flex gap-2 hover:scale-105 cursor-pointer mb-6">
          ← Back
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🗺️ Field Trips</h1>
          <p className="text-lg text-gray-600">Upcoming field trips and important information</p>
        </div>

        {/* Field Trip Cards */}
        <div className="space-y-6">
          {fieldTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
              {/* Header Section */}
              <div className="text-center mb-6 border-b-2 border-blue-200 pb-4">
                <h2 className="text-3xl font-bold text-blue-600 mb-2">{trip.title}</h2>
                <div className="flex flex-col md:flex-row justify-center gap-4 text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">📅</span>
                    <span className="font-semibold">{trip.date}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🕐</span>
                    <span className="font-semibold">{trip.time}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-blue-700 mb-2">📍 Location</h3>
                <p className="font-semibold text-gray-800 mb-1">{trip.location}</p>
                <p className="text-gray-600">{trip.address}</p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{trip.description}</p>
              </div>

              {/* Important Information */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-yellow-700 mb-3">⚠️ Important Information</h3>
                <div className="space-y-3">
                  {trip.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold mt-1">•</span>
                      <p className="text-gray-700">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dress Code */}
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-green-700 mb-2">👕 Dress Code</h3>
                <p className="text-gray-700">{trip.dressCode}</p>
              </div>

              {/* Lunch */}
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-orange-700 mb-2">🍽️ Lunch</h3>
                <p className="text-gray-700">{trip.lunch}</p>
              </div>

              {/* Permission Required */}
              {trip.permissionRequired && (
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-bold text-red-700 mb-2">✍️ Permission Slip Required</h3>
                  <p className="text-gray-700">A signed permission slip is required for your child to participate in this field trip. Please return the completed form to your child's teacher.</p>
                </div>
              )}

              {/* Chaperone Information */}
              {trip.chaperoneInfo && (
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-bold text-purple-700 mb-2">👨‍👩‍👧‍👦 Chaperone Information</h3>
                  <p className="text-gray-700 mb-2">{trip.chaperoneInfo}</p>
                  <p className="text-sm text-gray-600">
                    For more information regarding the background check, please visit:{' '}
                    <a href="https://www.fortbendisd.com/howtovolunteer" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      https://www.fortbendisd.com/howtovolunteer
                    </a>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Chaperone selection will be on a first come, first served basis for those who have completed a background check.</p>
                </div>
              )}

              {/* Contact Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-gray-700 mb-3">📞 Questions?</h3>
                <p className="text-gray-700">If you have any questions about this field trip, please contact your student's teacher.</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-bold text-lg">Mrs. Colbert</h4>
                    <p className="text-sm text-blue-600">Yolanda.colbert@fortbendisd.gov</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-bold text-lg">Mrs. Gaines</h4>
                    <p className="text-sm text-blue-600">Stephanie.Gaines@fortbendisd.gov</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-bold text-lg">Mrs. Tea</h4>
                    <p className="text-sm text-blue-600">Stacy.Tea@fortbendisd.gov</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
          <p>Check back soon for more field trip information!</p>
        </div>
      </div>
    </div>
  );
};

export default FieldTrips;

