import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import SearchBar from './components/SearchBar'; // Ny import
import Phrasebook from './pages/Phrasebook'; // Importera Phrasebook

const App = () => {
  const handleSearch = (query: string) => {
    console.log("Search query:", query); // Placeholder för söklogik
  };

  return (
    <Router>
      <div className="d-flex">
        <div className="content p-4">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SearchBar onSearch={handleSearch} /> {/* Lägg till SearchBar */}
                  <h2>Menu</h2>
                </>
              }
            />
            <Route path="/phrasebook" element={<Phrasebook />} /> {/* Lägg till denna */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
