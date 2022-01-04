import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import NFLStream from "./nflstream";
import Wrapped from "./wrapped";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NFLStream />} />
        <Route path="wrapped" element={<Wrapped />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
