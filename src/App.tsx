import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RequestGeneration from "./components/RequestGeneration";
import SecretSubmission from "./components/SecretSubmission";
import SecretRetrieval from "./components/SecretRetrieval";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequestGeneration />} />
        <Route path="/request/:requestId" element={<SecretSubmission />} />
        <Route path="/retrieve/:retrievalId" element={<SecretRetrieval />} />
      </Routes>
    </Router>
  );
}

export default App;
