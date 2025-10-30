// Science Subject Content - Lazy Loaded Module
// Enhanced Science Questions (50+ questions)
export const scienceQuestions = [
  // Basic Science Concepts
  { question: 'What do plants need to grow?', options: ['Water and sunlight', 'Only water'], correct: 'Water and sunlight', type: 'multiple-choice', image: '🌱', explanation: 'Plants need water, sunlight, air, and nutrients to grow healthy and strong!' },
  { question: 'What happens to water when it gets very cold?', options: ['It becomes ice', 'It disappears'], correct: 'It becomes ice', type: 'multiple-choice', image: '❄️', explanation: 'When water freezes, it turns into ice - a solid form of water!' },
  { question: 'Which part of the plant grows underground?', options: ['Roots', 'Leaves'], correct: 'Roots', type: 'multiple-choice', image: '🌿', explanation: 'Roots grow underground to help the plant stay in place and drink water!' },
  { question: 'What do we call baby animals?', options: ['Offspring', 'Parents'], correct: 'Offspring', type: 'multiple-choice', image: '🐣', explanation: 'Baby animals are called offspring - they grow up to be like their parents!' },
  { question: 'What makes the sound of thunder?', options: ['Lightning', 'Rain'], correct: 'Lightning', type: 'multiple-choice', image: '⚡', explanation: 'Lightning creates thunder by heating the air very quickly!' },
  
  // Weather and Seasons
  { question: 'What season comes after winter?', options: ['Spring', 'Fall'], correct: 'Spring', type: 'multiple-choice', image: '🌸', explanation: 'Spring comes after winter, when flowers bloom and trees get new leaves!' },
  { question: 'What causes rain?', options: ['Clouds', 'Wind'], correct: 'Clouds', type: 'multiple-choice', image: '☁️', explanation: 'Rain comes from water droplets in clouds that get too heavy and fall down!' },
  { question: 'Which is the hottest season?', options: ['Summer', 'Winter'], correct: 'Summer', type: 'multiple-choice', image: '☀️', explanation: 'Summer is the hottest season when the sun shines the longest!' },
  { question: 'What do we see in the sky during a storm?', options: ['Lightning', 'Stars'], correct: 'Lightning', type: 'multiple-choice', image: '⛈️', explanation: 'Lightning is the bright flash we see during thunderstorms!' },
  { question: 'What happens to leaves in fall?', options: ['They change colors', 'They grow bigger'], correct: 'They change colors', type: 'multiple-choice', image: '🍂', explanation: 'In fall, leaves change from green to beautiful colors like red, orange, and yellow!' },
  
  // Animals and Habitats
  { question: 'Where do fish live?', options: ['In water', 'On land'], correct: 'In water', type: 'multiple-choice', image: '🐟', explanation: 'Fish live in water like oceans, rivers, and lakes!' },
  { question: 'What do bees make?', options: ['Honey', 'Milk'], correct: 'Honey', type: 'multiple-choice', image: '🐝', explanation: 'Bees make honey from flower nectar - it\'s sweet and delicious!' },
  { question: 'Which animal is known for changing colors?', options: ['Chameleon', 'Elephant'], correct: 'Chameleon', type: 'multiple-choice', image: '🦎', explanation: 'Chameleons can change their skin color to blend in with their surroundings!' },
  { question: 'What do we call animals that eat only plants?', options: ['Herbivores', 'Carnivores'], correct: 'Herbivores', type: 'multiple-choice', image: '🐰', explanation: 'Herbivores are animals that eat only plants, like rabbits and deer!' },
  { question: 'Which animal is the largest mammal?', options: ['Blue whale', 'Elephant'], correct: 'Blue whale', type: 'multiple-choice', image: '🐋', explanation: 'Blue whales are the largest animals that have ever lived on Earth!' },
  
  // Human Body
  { question: 'How many senses do humans have?', options: ['Five', 'Three'], correct: 'Five', type: 'multiple-choice', image: '👁️', explanation: 'We have five senses: sight, hearing, smell, taste, and touch!' },
  { question: 'What helps us breathe?', options: ['Lungs', 'Stomach'], correct: 'Lungs', type: 'multiple-choice', image: '🫁', explanation: 'Our lungs help us breathe by taking in oxygen and releasing carbon dioxide!' },
  { question: 'What is the hardest part of our body?', options: ['Teeth', 'Nails'], correct: 'Teeth', type: 'multiple-choice', image: '🦷', explanation: 'Teeth are the hardest part of our body - they help us chew food!' },
  { question: 'How many bones do babies have when they are born?', options: ['About 300', 'About 100'], correct: 'About 300', type: 'multiple-choice', image: '👶', explanation: 'Babies are born with about 300 bones, but some fuse together as they grow!' },
  { question: 'What pumps blood through our body?', options: ['Heart', 'Brain'], correct: 'Heart', type: 'multiple-choice', image: '❤️', explanation: 'Our heart is like a pump that sends blood all around our body!' },
  
  // Space and Earth
  { question: 'What is the closest star to Earth?', options: ['The Sun', 'The Moon'], correct: 'The Sun', type: 'multiple-choice', image: '☀️', explanation: 'The Sun is our closest star and gives us light and warmth!' },
  { question: 'How many planets are in our solar system?', options: ['Eight', 'Ten'], correct: 'Eight', type: 'multiple-choice', image: '🪐', explanation: 'There are eight planets in our solar system, including Earth!' },
  { question: 'What causes day and night?', options: ['Earth spinning', 'Sun moving'], correct: 'Earth spinning', type: 'multiple-choice', image: '🌍', explanation: 'Day and night happen because Earth spins around like a top!' },
  { question: 'What do we call the path planets take around the Sun?', options: ['Orbit', 'Circle'], correct: 'Orbit', type: 'multiple-choice', image: '🌌', explanation: 'An orbit is the path a planet takes as it goes around the Sun!' },
  { question: 'Which planet is known as the Red Planet?', options: ['Mars', 'Venus'], correct: 'Mars', type: 'multiple-choice', image: '🔴', explanation: 'Mars looks red because of iron rust on its surface!' },
];

export const scienceAchievements = [
  { id: 'science_explorer', name: 'Science Explorer', description: 'Complete 10 science questions', icon: '🔬', category: 'progress' },
  { id: 'nature_lover', name: 'Nature Lover', description: 'Answer all plant and animal questions correctly', icon: '🌿', category: 'mastery' },
  { id: 'space_cadet', name: 'Space Cadet', description: 'Master all space-related questions', icon: '🚀', category: 'mastery' },
  { id: 'weather_watcher', name: 'Weather Watcher', description: 'Perfect score on weather questions', icon: '🌦️', category: 'mastery' },
  { id: 'body_expert', name: 'Body Expert', description: 'Learn about the human body', icon: '🧠', category: 'mastery' }
];

export default {
  scienceQuestions,
  scienceAchievements
};