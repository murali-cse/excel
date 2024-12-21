import React, { useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";

function JiraFormatter() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  // Helper function to convert seconds to "Xh Ym" format
  const convertSecondsToHoursAndMinutes = (seconds) => {
    if (!seconds) return ""; // Handle empty or undefined values
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: true, // Parse headers
        skipEmptyLines: true,
        complete: (result) => {
          const csvHeaders = Object.keys(result.data[0]); // Extract headers
          setHeaders(csvHeaders);

          const filteredData = result.data.map((row) => ({
            Assignee: row["Assignee"] || row["assignee"],
            Project: row["Project name"] || row["project name"],
            Summary: row["Summary"] || row["summary"],
            Status: row["Status"] || row["status"],
            Due_Date: row["Due date"] || row["due date"],
            Original_Estimated: convertSecondsToHoursAndMinutes(
              row["Σ Original Estimate"] || row["Original Estimate"]
            ),
            TimeSpent: convertSecondsToHoursAndMinutes(
              row["Σ Time Spent"] || row["Time Spent"]
            ),
          }));

          setData(filteredData);
        },
      });
    }
  };

  const exportToExcel = () => {
    const csvHeaders = [
      "Assignee",
      "Project",
      "Summary",
      "Status",
      "Due Date",
      "Original Estimated",
      "Time Spent",
    ];
    const csvData = [
      csvHeaders,
      ...data.map((row) => [
        row.Assignee,
        row.Project,
        row.Summary,
        row.Status,
        row.Due_Date,
        row.Original_Estimated,
        row.TimeSpent,
      ]),
    ];
    const csvContent = Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "jira_filtered_tasks.csv");
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <div className="flex row justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif pb-4 text-gray-800 border-b-2 border-gray-300 mb-4">
            Jira Time Based Report
          </h1>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        {data.length > 0 && (
          <div>
            <button
              onClick={exportToExcel}
              className="bg-blue-700 text-white mr-2"
            >
              Download CSV
            </button>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Assignee
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Project
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Summary
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Status
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Due Date
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Original Estimated
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Time Spent
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } text-gray-700`}
                >
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Assignee}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Project}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Summary}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Status}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Due_Date}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.Original_Estimated}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {row.TimeSpent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JiraFormatter;
