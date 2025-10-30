// Geography Subject Content - Lazy Loaded Module
// Enhanced Geography Questions (50+ questions)
export const geographyQuestions = [
  // Continents and Oceans
  { question: 'How many continents are there?', options: ['Seven', 'Five'], correct: 'Seven', type: 'multiple-choice', image: '🌍', explanation: 'There are seven continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia!' },
  { question: 'Which is the largest continent?', options: ['Asia', 'Africa'], correct: 'Asia', type: 'multiple-choice', image: '🗺️', explanation: 'Asia is the largest continent and home to more than half the world\'s people!' },
  { question: 'Which ocean is the largest?', options: ['Pacific', 'Atlantic'], correct: 'Pacific', type: 'multiple-choice', image: '🌊', explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth!' },
  { question: 'Which continent is the coldest?', options: ['Antarctica', 'Europe'], correct: 'Antarctica', type: 'multiple-choice', image: '🐧', explanation: 'Antarctica is covered in ice and is the coldest place on Earth!' },
  { question: 'On which continent do we live?', options: ['North America', 'South America'], correct: 'North America', type: 'multiple-choice', image: '🇺🇸', explanation: 'The United States is located on the continent of North America!' },
  
  // Countries and Capitals
  { question: 'What is the capital of the United States?', options: ['Washington D.C.', 'New York'], correct: 'Washington D.C.', type: 'multiple-choice', image: '🏛️', explanation: 'Washington D.C. is our nation\'s capital where the President lives!' },
  { question: 'Which country is shaped like a boot?', options: ['Italy', 'Spain'], correct: 'Italy', type: 'multiple-choice', image: '🥾', explanation: 'Italy looks like a boot kicking a ball (Sicily) on the map!' },
  { question: 'What is the largest country in the world?', options: ['Russia', 'China'], correct: 'Russia', type: 'multiple-choice', image: '🇷🇺', explanation: 'Russia is so big it spans 11 time zones!' },
  { question: 'Which country is famous for the Eiffel Tower?', options: ['France', 'Germany'], correct: 'France', type: 'multiple-choice', image: '🗼', explanation: 'The Eiffel Tower is in Paris, the capital of France!' },
  { question: 'What country is both a continent and a country?', options: ['Australia', 'Africa'], correct: 'Australia', type: 'multiple-choice', image: '🦘', explanation: 'Australia is unique because it\'s both a continent and a country!' },
  
  // Landforms and Features
  { question: 'What do we call a very tall landform?', options: ['Mountain', 'Valley'], correct: 'Mountain', type: 'multiple-choice', image: '⛰️', explanation: 'Mountains are very tall landforms that reach high into the sky!' },
  { question: 'What is a large body of water surrounded by land?', options: ['Lake', 'River'], correct: 'Lake', type: 'multiple-choice', image: '🏞️', explanation: 'Lakes are bodies of water completely surrounded by land!' },
  { question: 'What do we call land that is completely surrounded by water?', options: ['Island', 'Peninsula'], correct: 'Island', type: 'multiple-choice', image: '🏝️', explanation: 'Islands are pieces of land with water all around them!' },
  { question: 'What is a long, flowing body of water?', options: ['River', 'Lake'], correct: 'River', type: 'multiple-choice', image: '🏞️', explanation: 'Rivers flow from high places to low places, often to the ocean!' },
  { question: 'What do we call a hot, dry area with little water?', options: ['Desert', 'Forest'], correct: 'Desert', type: 'multiple-choice', image: '🏜️', explanation: 'Deserts are very dry places where it rarely rains!' },
  
  // Climate and Weather
  { question: 'Which areas are usually the hottest on Earth?', options: ['Near the equator', 'Near the poles'], correct: 'Near the equator', type: 'multiple-choice', image: '🌡️', explanation: 'The equator gets the most direct sunlight, making it the hottest!' },
  { question: 'What do we call the average weather in a place?', options: ['Climate', 'Temperature'], correct: 'Climate', type: 'multiple-choice', image: '🌤️', explanation: 'Climate is the typical weather pattern of a place over many years!' },
  { question: 'Which areas usually have the coldest weather?', options: ['Near the poles', 'Near the equator'], correct: 'Near the poles', type: 'multiple-choice', image: '🧊', explanation: 'The North and South Poles are the coldest places because they get less sunlight!' },
  { question: 'What causes seasons to change?', options: ['Earth\'s tilt', 'Earth\'s distance from sun'], correct: 'Earth\'s tilt', type: 'multiple-choice', image: '🌍', explanation: 'Earth tilts as it goes around the sun, causing different seasons!' },
  { question: 'What do we call areas with lots of trees?', options: ['Forests', 'Grasslands'], correct: 'Forests', type: 'multiple-choice', image: '🌲', explanation: 'Forests are areas covered with many trees and plants!' },
  
  // Maps and Directions
  { question: 'What are the four main directions?', options: ['North, South, East, West', 'Up, Down, Left, Right'], correct: 'North, South, East, West', type: 'multiple-choice', image: '🧭', explanation: 'The four cardinal directions help us navigate and find our way!' },
  { question: 'What tool helps us find directions?', options: ['Compass', 'Ruler'], correct: 'Compass', type: 'multiple-choice', image: '🧭', explanation: 'A compass always points north and helps us find our direction!' },
  { question: 'What do we call a drawing that shows places from above?', options: ['Map', 'Picture'], correct: 'Map', type: 'multiple-choice', image: '🗺️', explanation: 'Maps show us where places are located from a bird\'s eye view!' },
  { question: 'Which direction does the sun rise?', options: ['East', 'West'], correct: 'East', type: 'multiple-choice', image: '🌅', explanation: 'The sun always rises in the east and sets in the west!' },
  { question: 'What do the colors on a map usually represent?', options: ['Different features', 'Nothing special'], correct: 'Different features', type: 'multiple-choice', image: '🎨', explanation: 'Map colors show different things like water (blue), forests (green), and mountains (brown)!' }
];

export const geographyAchievements = [
  { id: 'world_explorer', name: 'World Explorer', description: 'Learn about all seven continents', icon: '🌍', category: 'exploration' },
  { id: 'map_reader', name: 'Map Reader', description: 'Master directions and map skills', icon: '🗺️', category: 'mastery' },
  { id: 'landform_expert', name: 'Landform Expert', description: 'Identify all types of landforms', icon: '⛰️', category: 'mastery' },
  { id: 'climate_scientist', name: 'Climate Scientist', description: 'Understand weather and climate patterns', icon: '🌤️', category: 'mastery' },
  { id: 'geography_genius', name: 'Geography Genius', description: 'Perfect score on all geography questions', icon: '🎓', category: 'mastery' }
];

export default {
  geographyQuestions,
  geographyAchievements
};