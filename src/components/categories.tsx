export const categoryIcons: Record<string, JSX.Element> = {
  "Hälsningar": <span className="emoji" role="img" aria-label="Hälsningar">💬</span>,
  "Mat & dryck": <span className="emoji" role="img" aria-label="Mat & dryck">🍽️</span>,
  "Artighet": <span className="emoji" role="img" aria-label="Artighet">🤝</span>,
  "Shopping": <span className="emoji" role="img" aria-label="Shopping">🏷️</span>,
  "Vardag": <span className="emoji" role="img" aria-label="Vardag">🏷️</span>,
  "Tid": <span className="emoji" role="img" aria-label="Tid">⏰</span>,
  "Resa": <span className="emoji" role="img" aria-label="Resa">✈️</span>,
  "Kärlek": <span className="emoji" role="img" aria-label="Kärlek">❤️</span>,
  "Presentation": <span className="emoji" role="img" aria-label="Presentation">👤</span>,
};

export const categories = Object.keys(categoryIcons);

export const getCategoryIcon = (category: string): JSX.Element => {
  return categoryIcons[category] || <span className="emoji" role="img" aria-label="Default">🏷️</span>;
};