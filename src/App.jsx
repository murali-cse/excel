import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import JiraTimeBasedReport from "./pages/JiraTimeBasedReport";
import JiraDailyBasedReport from "./pages/JiraDailyBasedReport";
import AttendanceFormatter from "./pages/AttendanceFormatter";
import Test from "./pages/Test";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jira-daily-report" element={<JiraDailyBasedReport />} />
        <Route path="/jira-time-report" element={<JiraTimeBasedReport />} />
        <Route path="/attendance-formatter" element={<AttendanceFormatter />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </Router>
  );
}

export default App;
