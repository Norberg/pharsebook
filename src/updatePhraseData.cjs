const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/phrases.json');

try {
  const phrases = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updatedPhrases = phrases.map(phrase => {
    if (!phrase.created) {
      return { ...phrase, created: new Date().toISOString() };
    }
    return phrase;
  });
  fs.writeFileSync(filePath, JSON.stringify(updatedPhrases, null, 2));
  console.log('Alla fraser är nu uppdaterade med ett created-fält.');
} catch (error) {
  console.error('Fel vid uppdatering av fraser:', error);
}