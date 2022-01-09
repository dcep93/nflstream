import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import NFLStream from "./nflstream";
import Wrapped from "./wrapped";

function App() {
  return <BrowserRouter>{getApp()}</BrowserRouter>;
}

function getApp() {
  // eslint-disable-next-line no-restricted-globals
  if (location.pathname === "/wrapped") return <Wrapped />;
  return <NFLStream />;
}

export default App;
