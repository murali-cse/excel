// Home.js
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  // useNavigate hook from react-router-dom for navigation
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 className="text-3xl font-bold font-serif pb-4 text-gray-800">
        Welcome to the Formatter App
      </h1>
      <div className="button-container">
        {/* Buttons to navigate to different pages */}
        <button
          className="bg-blue-700 text-white mr-2 px-4 py-2 rounded"
          onClick={() => navigate("/jira-formatter")}
        >
          Go to Jira Formatter
        </button>
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => navigate("/attendance-formatter")}
        >
          Go to Attendance Formatter
        </button>
      </div>
    </div>
  );
};

export default Home;
