const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '/data/phrases.json');

try {
  const phrases = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Add the 'created' field if it is missing
  const updatedPhrases = phrases.map(phrase => {
    if (!phrase.created) {
      return { ...phrase, created: new Date().toISOString() };
    }
    return phrase;
  });

  // Sort by 'created' timestamp, and when equal, sort by 'original'
  updatedPhrases.sort((a, b) => {
    const dateA = new Date(a.created);
    const dateB = new Date(b.created);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    // If the 'created' field is the same, sort by "original"
    if (a.original && b.original) {
      return a.original.localeCompare(b.original);
    } else if (a.original) {
      return -1;
    } else if (b.original) {
      return 1;
    } else {
      return 0;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedPhrases, null, 2));
  console.log('All phrases have been updated with a "created" field and sorted.');
} catch (error) {
  console.error('Error updating phrases:', error);
}