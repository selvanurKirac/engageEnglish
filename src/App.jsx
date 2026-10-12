import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import Sidebar from "./components/Sidebar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Game from "./pages/game/Game";
import LevelTest from "./pages/leveltest/LevelTest";
import VocabularyControl from "./pages/vocabularyControl/VocabularyControl";
import BusinessEnglish from "./pages/businessenglish/BusinessEnglish";
import BusinessVideos from "./pages/businessenglish/BusinessVideos";
import ProtectedRoute from "./components/ProtectedRoute";
import PronunciationCheck from "./pages/pronunciationCheck/PronunciationCheck";
import TimeChart from "./pages/timeChart/TimeChart";
import AccountPage from "./pages/account/AccountPage";
import { useSessionTracker } from "./hooks/useSessionTracker";
import { useUserAuth } from "./context/UserAuthContext";
import StreakChart from "./components/StreakChart";

function App() {
  const [toggle, setToggle] = useState(true);
  const { user } = useUserAuth();

  // Global oturum takibi ve modal component'ini al
  const { GoalModal } = useSessionTracker();

  const Toggle = () => {
    setToggle(!toggle);
  };

  // Debug: User ve modal durumunu takip et
  useEffect(() => {
    console.log("🏠 App: User changed to:", user?.uid || "null");
  }, [user]);

  return (
    <Router>
      <div className="container-fluid min-vh-100" key={user?.uid || "no-user"}>
        <div className="row">
          {toggle && (
            <div className="col-4 col-md-2 bg-white vh-100 position-fixed">
              <Sidebar />
            </div>
          )}
          {toggle && <div className="col-4 col-md-2"></div>}
          <div className="col">
            <Routes>
              <Route path="/login" element={<Login Toggle={Toggle} />} />
              <Route path="/register" element={<Signup Toggle={Toggle} />} />
              <Route path="/" element={<Home Toggle={Toggle} />} />
              <Route
                path="/game"
                element={
                  <ProtectedRoute>
                    <Game Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/streakchart"
                element={
                  <ProtectedRoute>
                    <StreakChart Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leveltest"
                element={
                  <ProtectedRoute>
                    <LevelTest Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vocabularycontrol"
                element={
                  <ProtectedRoute>
                    <VocabularyControl Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/business-english"
                element={
                  <ProtectedRoute>
                    <BusinessEnglish />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/business-english/videos/:term"
                element={
                  <ProtectedRoute>
                    <BusinessVideos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pronunciationcheck"
                element={
                  <ProtectedRoute>
                    <PronunciationCheck Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timechart"
                element={
                  <ProtectedRoute>
                    <TimeChart Toggle={Toggle} />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>

      {/* Global Goal Setting Modal */}
      {console.log("🏠 App: About to render GoalModal")}
      <GoalModal />
    </Router>
  );
}

export default App;
