import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import "./App.css";
import NFLStream from "./nflstream";

function App() {
  return <NFLStream />;
  // return (
  //   <BrowserRouter>
  //     <Routes>
  //       <Route path="wrapped" element={<Wrapped />} />
  //       <Route path="*" element={<NFLStream />} />
  //     </Routes>
  //   </BrowserRouter>
  // );
}

export default App;
