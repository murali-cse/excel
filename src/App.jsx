import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import JiraFormatter from "./pages/JiraFormatter";
import AttendanceFormatter from "./pages/AttendanceFormatter";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jira-formatter" element={<JiraFormatter />} />
        <Route path="/attendance-formatter" element={<AttendanceFormatter />} />
      </Routes>
    </Router>
  );
}

export default App;
