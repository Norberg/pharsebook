import { FaTag, FaHandHolding, FaUtensils, FaClock, FaComments, FaHeart } from "react-icons/fa";
import { FaPlane } from "react-icons/fa6";

export const categoryIcons: Record<string, JSX.Element> = {
  "Hälsningar": <FaComments />,
  "Mat & dryck": <FaUtensils />,
  "Artighet": <FaHandHolding />,
  "Shopping": <FaTag />,
  "Vardag": <FaTag />,
  "Tid": <FaClock />,
  "Resa": <FaPlane />,
  "Kärlek": <FaHeart />,
};

export const categories = Object.keys(categoryIcons);

export const getCategoryIcon = (category: string): JSX.Element => {
  return categoryIcons[category] || <FaTag />; // Default icon
};