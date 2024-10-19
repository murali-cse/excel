import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function App() {
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
      const timespend = row[3];

      if (level === 0) {
        // When we encounter a new person, process the previous person's tasks
        if (currentName) {
          // Add a row for the total time spent by the previous person
          const totalTime = convertToHoursAndMinutes(
            totalHoursByPerson,
            totalMinutesByPerson
          );
          formattedData.push({
            SNo: serialNo++, // Assign serial number for each person
            ResourceName: currentName,
            Tasks: "", // Empty for total time row
            TimeUtilized: totalTime,
            Status: "",
          });

          // Add the individual tasks for the previous person
          tasksByPerson.forEach((task) => {
            formattedData.push({
              SNo: "", // No serial number for tasks
              ResourceName: "", // Empty for subsequent task rows
              Tasks: task.Tasks,
              TimeUtilized: task.TimeUtilized,
              Status: task.Status,
            });
          });

          // Add a blank row to create space between logs of different people
          formattedData.push({
            SNo: "",
            ResourceName: "",
            Tasks: "",
            TimeUtilized: "",
            Status: "",
          });
        }

        // Reset for the new person
        currentName = value;
        totalHoursByPerson = 0;
        totalMinutesByPerson = 0;
        tasksByPerson = [];
      } else if (level === 1) {
        // Level 1 indicates a task
        tasksByPerson.push({
          Tasks: value,
          TimeUtilized: timespend,
          Status: "",
        });

        // Split the time into hours and minutes, then accumulate
        const [hours, minutes] = timespend.split(":").map(Number);
        totalHoursByPerson += hours;
        totalMinutesByPerson += minutes;
      } else if (level === 2) {
        // Level 2 indicates the status of the task
        if (tasksByPerson.length > 0) {
          tasksByPerson[tasksByPerson.length - 1].Status = value;
        }
      }
    });

    // After the last person
    if (currentName) {
      const totalTime = convertToHoursAndMinutes(
        totalHoursByPerson,
        totalMinutesByPerson
      );
      formattedData.push({
        SNo: serialNo++, // Assign serial number for the last person
        ResourceName: currentName,
        Tasks: "",
        TimeUtilized: totalTime,
        Status: "",
      });

      tasksByPerson.forEach((task) => {
        formattedData.push({
          SNo: "", // No serial number for tasks
          ResourceName: "",
          Tasks: task.Tasks,
          TimeUtilized: task.TimeUtilized,
          Status: task.Status,
        });
      });

      // Add a blank row to create space between logs of different people
      formattedData.push({
        SNo: "",
        ResourceName: "",
        Tasks: "",
        TimeUtilized: "",
        Status: "",
      });
    }

    setData(formattedData);
  };

  const convertToHoursAndMinutes = (totalHours, totalMinutes) => {
    totalHours += Math.floor(totalMinutes / 60); // Convert minutes to hours
    totalMinutes = totalMinutes % 60; // Keep remaining minutes
    return `${totalHours}h ${totalMinutes}m`;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "formatted_tasks.xlsx");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Excel Formatter</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      {data.length > 0 && (
        <div>
          <h2>Data Preview</h2>
          <table border="1">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Resource Name</th>
                <th>Tasks</th>
                <th>Time Utilized</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                let previousName =
                  index > 0 ? data[index - 1].ResourceName : null;

                return (
                  <tr key={index}>
                    <td>{item.SNo}</td>
                    <td>
                      {item.ResourceName === previousName
                        ? ""
                        : item.ResourceName}
                    </td>
                    <td>{item.Tasks}</td>
                    <td>{item.TimeUtilized}</td>
                    <td>{item.Status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button style={styles.button} onClick={exportToExcel}>
            Download
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  button: {
    display: "block",
    margin: "20px auto",
    padding: "10px 20px",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};

export default App;
