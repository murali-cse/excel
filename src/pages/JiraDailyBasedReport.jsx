import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

function JiraFormatter() {
  const [data, setData] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        processExcelData(jsonData);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const processExcelData = (jsonData) => {
    const formattedData = [];
    let currentName = "";
    let totalHoursByPerson = 0;
    let totalMinutesByPerson = 0;
    let tasksByPerson = [];
    let serialNo = 1;

    jsonData.forEach((row) => {
      const level = row[0]; // Level column
      const value = row[1]; // Users/issues/CurrentStatus column
      const jiraId = row[2]; // Jira ID column
      const timespend = row[3]; // Time spent

      if (level === 0) {
        if (currentName) {
          const totalTime = convertToHoursAndMinutes(
            totalHoursByPerson,
            totalMinutesByPerson
          );
          formattedData.push({
            SNo: serialNo++,
            ResourceName: currentName,
            Tasks: "",
            JiraId: "", // Leave empty for summary rows
            TimeUtilized: totalTime,
            Status: "",
          });

          tasksByPerson.forEach((task) => {
            formattedData.push({
              SNo: "",
              ResourceName: "",
              Tasks: task.Tasks,
              JiraId: task.JiraId, // Include Jira ID here
              TimeUtilized: task.TimeUtilized,
              Status: task.Status,
            });
          });

          formattedData.push({
            SNo: "",
            ResourceName: "",
            Tasks: "",
            JiraId: "",
            TimeUtilized: "",
            Status: "",
          });
        }

        currentName = value;
        totalHoursByPerson = 0;
        totalMinutesByPerson = 0;
        tasksByPerson = [];
      } else if (level === 1) {
        tasksByPerson.push({
          Tasks: value,
          JiraId: jiraId, // Capture the Jira ID here
          TimeUtilized: timespend,
          Status: "",
        });

        const [hours, minutes] = timespend.split(":").map(Number);
        totalHoursByPerson += hours;
        totalMinutesByPerson += minutes;
      } else if (level === 2) {
        if (tasksByPerson.length > 0) {
          tasksByPerson[tasksByPerson.length - 1].Status = value;
        }
      }
    });

    if (currentName) {
      const totalTime = convertToHoursAndMinutes(
        totalHoursByPerson,
        totalMinutesByPerson
      );
      formattedData.push({
        SNo: serialNo++,
        ResourceName: currentName,
        Tasks: "",
        JiraId: "",
        TimeUtilized: totalTime,
        Status: "",
      });

      tasksByPerson.forEach((task) => {
        formattedData.push({
          SNo: "",
          ResourceName: "",
          Tasks: task.Tasks,
          JiraId: task.JiraId, // Include Jira ID in final table row
          TimeUtilized: task.TimeUtilized,
          Status: task.Status,
        });
      });

      formattedData.push({
        SNo: "",
        ResourceName: "",
        Tasks: "",
        JiraId: "",
        TimeUtilized: "",
        Status: "",
      });
    }

    setData(formattedData);
  };

  const convertToHoursAndMinutes = (totalHours, totalMinutes) => {
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    return `${totalHours}h ${totalMinutes}m`;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: [
        "SNo",
        "ResourceName",
        "Tasks",
        "JiraId",
        "TimeUtilized",
        "Status",
      ],
    });
    const workbook = XLSX.utils.book_new();

    // Loop through the data to apply styles if necessary
    data.forEach((item, index) => {
      if (item.Tasks === "") {
        const timeCellRef = XLSX.utils.encode_cell({ r: index + 1, c: 4 }); // TimeUtilized column
        worksheet[timeCellRef].s = { font: { bold: true } }; // Make the total time bold
      }
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "formatted_tasks.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.text("Task Report", 20, 10);

    const tableColumn = [
      "S.No",
      "Resource Name",
      "Tasks",
      "Jira Id", // Include Jira Id column
      "Time Utilized",
      "Status",
    ];
    const tableRows = [];

    data.forEach((item) => {
      tableRows.push([
        item.SNo,
        item.ResourceName,
        item.Tasks,
        item.JiraId, // Include Jira Id in rows
        item.TimeUtilized,
        item.Status,
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      didParseCell: function (data) {
        // Apply bold to Time Utilized column for totalTime rows
        if (data.column.index === 4 && data.row.raw[2] === "") {
          data.cell.styles.fontStyle = "bold"; // Make it bold
          data.cell.styles.textColor = [0, 123, 255]; // Optional: Set color
        }
      },
    });

    doc.save("formatted_tasks.pdf");
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <div className="flex row justify-between mb-4">
        <div>
          <div className="flex row items-center gap-2">
            <h1 className="text-3xl font-bold font-serif pb-4 text-gray-800 border-b-2 border-gray-300 mb-4">
              Jira Daily Report
            </h1>
          </div>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        </div>
        {data.length > 0 && (
          <div className="">
            <button
              onClick={exportToExcel}
              className="bg-blue-700 text-white mr-2"
            >
              Download Excel
            </button>
            <button onClick={exportToPDF} className="bg-blue-700 text-white ">
              Download PDF
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
                  S.No
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Resource Name
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Tasks
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Jira Id
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Time Utilized
                </th>
                <th className="px-4 py-2 text-left border-b border-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                let previousName =
                  index > 0 ? data[index - 1].ResourceName : null;

                return (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } text-gray-700`}
                  >
                    <td className="px-4 py-2 border-b border-gray-300">
                      {item.SNo}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      {item.ResourceName === previousName
                        ? ""
                        : item.ResourceName}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      {item.Tasks}
                    </td>
                    <td
                      className={`px-4 py-2 border-b border-gray-300 ${
                        item.Tasks === "" ? "font-bold text-blue-600" : ""
                      }`}
                    >
                      {item.JiraId} {/* Correct casing here */}
                    </td>
                    <td
                      className={`px-4 py-2 border-b border-gray-300 ${
                        item.Tasks === "" ? "font-bold text-blue-600" : ""
                      }`}
                    >
                      {item.TimeUtilized}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      {item.Status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  button: {
    // display: "block",
    margin: "10px",
    padding: "10px 10px",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHead: {
    display: "flex",
    justifyContent: "end",
  },
};

export default JiraFormatter;
