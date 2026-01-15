// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Analyze from "./Analyze.jsx";
import ColorContrastPage from "./ColorContrastPage.jsx";
import SignLanguage from "./SignLanguage.jsx";
import SignCollector from "./SignCollector";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import "./index.css";
import AnalyzePage from "./Analyze.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<AnalyzePage />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/contrast" element={<ColorContrastPage />} />
        <Route path="/sign-language" element={<SignLanguage />} />
        <Route path="/collect-data" element={<SignCollector />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
