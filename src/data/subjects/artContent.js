// Art Subject Content - Lazy Loaded Module
// Enhanced Art Questions (50+ questions)
export const artQuestions = [
  // Basic Art Concepts
  { question: 'What are the three primary colors?', options: ['Red, blue, yellow', 'Red, green, blue'], correct: 'Red, blue, yellow', type: 'multiple-choice', image: '🎨', explanation: 'Primary colors are red, blue, and yellow - you can\'t make these by mixing other colors!' },
  { question: 'What color do you get when you mix red and yellow?', options: ['Orange', 'Purple'], correct: 'Orange', type: 'multiple-choice', image: '🧡', explanation: 'Red and yellow make orange - like a beautiful sunset!' },
  { question: 'What color do you get when you mix blue and yellow?', options: ['Green', 'Purple'], correct: 'Green', type: 'multiple-choice', image: '💚', explanation: 'Blue and yellow make green - like grass and leaves!' },
  { question: 'What color do you get when you mix red and blue?', options: ['Purple', 'Orange'], correct: 'Purple', type: 'multiple-choice', image: '💜', explanation: 'Red and blue make purple - a royal color!' },
  { question: 'What do we call colors that are next to each other on the color wheel?', options: ['Analogous', 'Complementary'], correct: 'Analogous', type: 'multiple-choice', image: '🌈', explanation: 'Analogous colors are neighbors on the color wheel and look good together!' },
  
  // Art Tools and Materials
  { question: 'What tool do artists use to paint?', options: ['Paintbrush', 'Spoon'], correct: 'Paintbrush', type: 'multiple-choice', image: '🖌️', explanation: 'Artists use paintbrushes to apply paint to canvas or paper!' },
  { question: 'What do we call the board artists paint on?', options: ['Canvas', 'Paper'], correct: 'Canvas', type: 'multiple-choice', image: '🖼️', explanation: 'Canvas is a strong fabric that artists paint on!' },
  { question: 'What tool helps artists draw straight lines?', options: ['Ruler', 'Pencil'], correct: 'Ruler', type: 'multiple-choice', image: '📏', explanation: 'A ruler helps artists draw perfectly straight lines!' },
  { question: 'What do artists use to erase pencil marks?', options: ['Eraser', 'Tissue'], correct: 'Eraser', type: 'multiple-choice', image: '🧽', explanation: 'Erasers remove pencil marks so artists can fix mistakes!' },
  { question: 'What do we call the stand that holds a canvas?', options: ['Easel', 'Table'], correct: 'Easel', type: 'multiple-choice', image: '🎭', explanation: 'An easel holds the canvas at the right angle for painting!' },
  
  // Famous Artists and Art Styles
  { question: 'Who painted the Mona Lisa?', options: ['Leonardo da Vinci', 'Pablo Picasso'], correct: 'Leonardo da Vinci', type: 'multiple-choice', image: '👩‍🎨', explanation: 'Leonardo da Vinci painted the famous Mona Lisa with her mysterious smile!' },
  { question: 'What art style uses lots of dots to make pictures?', options: ['Pointillism', 'Realism'], correct: 'Pointillism', type: 'multiple-choice', image: '🔴', explanation: 'Pointillism uses tiny dots of color that blend together when you look from far away!' },
  { question: 'What do we call art made from clay?', options: ['Pottery', 'Painting'], correct: 'Pottery', type: 'multiple-choice', image: '🏺', explanation: 'Pottery is art made by shaping and firing clay!' },
  { question: 'What art form uses paper, scissors, and glue?', options: ['Collage', 'Drawing'], correct: 'Collage', type: 'multiple-choice', image: '✂️', explanation: 'Collage is made by cutting and pasting different materials together!' },
  { question: 'What do we call a picture of a person?', options: ['Portrait', 'Landscape'], correct: 'Portrait', type: 'multiple-choice', image: '👤', explanation: 'A portrait is a picture that shows a person\'s face or body!' },
  
  // Art Elements and Principles
  { question: 'What do we call the lightness or darkness of a color?', options: ['Value', 'Hue'], correct: 'Value', type: 'multiple-choice', image: '⚫', explanation: 'Value describes how light or dark a color is!' },
  { question: 'What element of art can be thick, thin, curved, or straight?', options: ['Line', 'Shape'], correct: 'Line', type: 'multiple-choice', image: '📏', explanation: 'Lines can have many different qualities and create the outline of shapes!' },
  { question: 'What do we call the area around, above, below, or within objects?', options: ['Space', 'Color'], correct: 'Space', type: 'multiple-choice', image: '🌌', explanation: 'Space is the area that surrounds objects in artwork!' },
  { question: 'What principle of art creates visual stability?', options: ['Balance', 'Movement'], correct: 'Balance', type: 'multiple-choice', image: '⚖️', explanation: 'Balance makes artwork feel stable and pleasing to look at!' },
  { question: 'What do we call the way something feels or looks like it feels?', options: ['Texture', 'Pattern'], correct: 'Texture', type: 'multiple-choice', image: '🤚', explanation: 'Texture is how rough, smooth, soft, or hard something feels!' },
  
  // Art Around the World
  { question: 'What country is famous for origami?', options: ['Japan', 'France'], correct: 'Japan', type: 'multiple-choice', image: '🗾', explanation: 'Origami is the Japanese art of folding paper into beautiful shapes!' },
  { question: 'What ancient civilization built the pyramids?', options: ['Egyptians', 'Romans'], correct: 'Egyptians', type: 'multiple-choice', image: '🔺', explanation: 'The ancient Egyptians built amazing pyramids that still stand today!' },
  { question: 'What do we call the colorful art on walls?', options: ['Murals', 'Posters'], correct: 'Murals', type: 'multiple-choice', image: '🎨', explanation: 'Murals are large paintings or artworks painted directly on walls!' },
  { question: 'What art form tells stories through pictures?', options: ['Comics', 'Sculptures'], correct: 'Comics', type: 'multiple-choice', image: '💭', explanation: 'Comics use pictures and words together to tell exciting stories!' },
  { question: 'What do we call art made from stone or metal?', options: ['Sculpture', 'Drawing'], correct: 'Sculpture', type: 'multiple-choice', image: '🗿', explanation: 'Sculptures are three-dimensional artworks you can walk around!' }
];

export const artAchievements = [
  { id: 'color_master', name: 'Color Master', description: 'Learn all about primary and secondary colors', icon: '🌈', category: 'mastery' },
  { id: 'artist_tools', name: 'Artist\'s Toolkit', description: 'Identify all art tools correctly', icon: '🎨', category: 'mastery' },
  { id: 'famous_artist', name: 'Art History Buff', description: 'Learn about famous artists and their work', icon: '👨‍🎨', category: 'mastery' },
  { id: 'creative_genius', name: 'Creative Genius', description: 'Perfect score on all art questions', icon: '✨', category: 'mastery' },
  { id: 'world_art', name: 'World Art Explorer', description: 'Discover art from around the world', icon: '🌍', category: 'exploration' }
];

export default {
  artQuestions,
  artAchievements
};