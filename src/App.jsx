import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
// import GameAdminTest from "./pages/GameAdminTest";
import DeckBuilder from "./pages/DeckBuilder";
import Rules from "./pages/Rules";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Single homepage */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />

        <Route path="/game" element={<Game />} />
        {/* <Route path="/game-ADMIN-TEST" element={<GameAdminTest />} /> */}
        <Route path="/deckbuilder" element={<DeckBuilder />} />
        <Route path="/rules" element={<Rules />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}