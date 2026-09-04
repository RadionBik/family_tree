import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserLogin from "./components/UserLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import InvitePage from "./pages/InvitePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
