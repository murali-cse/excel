import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
        if (currentName) {
          const totalTime = convertToHoursAndMinutes(
            totalHoursByPerson,
            totalMinutesByPerson
          );
          formattedData.push({
            SNo: serialNo++,
            ResourceName: currentName,
            Tasks: "",
            TimeUtilized: totalTime,
            Status: "",
          });

          tasksByPerson.forEach((task) => {
            formattedData.push({
              SNo: "",
              ResourceName: "",
              Tasks: task.Tasks,
              TimeUtilized: task.TimeUtilized,
              Status: task.Status,
            });
          });

          formattedData.push({
            SNo: "",
            ResourceName: "",
            Tasks: "",
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
        TimeUtilized: totalTime,
        Status: "",
      });

      tasksByPerson.forEach((task) => {
        formattedData.push({
          SNo: "",
          ResourceName: "",
          Tasks: task.Tasks,
          TimeUtilized: task.TimeUtilized,
          Status: task.Status,
        });
      });

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
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    return `${totalHours}h ${totalMinutes}m`;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    data.forEach((item, index) => {
      if (item.Tasks === "") {
        const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 3 });
        worksheet[cellRef].s = { font: { bold: true } };
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
      "Time Utilized",
      "Status",
    ];
    const tableRows = [];

    data.forEach((item) => {
      tableRows.push([
        item.SNo,
        item.ResourceName,
        item.Tasks,
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
        if (data.column.index === 3 && data.row.raw[2] === "") {
          data.cell.styles.fontStyle = "bold"; // Make it bold
          data.cell.styles.textColor = [0, 123, 255]; // Optional: Set color
        }
      },
    });

    doc.save("formatted_tasks.pdf");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Excel Formatter</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      {data.length > 0 && (
        <div>
          <h2>Data Preview</h2>
          <div style={styles.buttonHead}>
            <button style={styles.button} onClick={exportToExcel}>
              Download Excel
            </button>
            <button style={styles.button} onClick={exportToPDF}>
              Download PDF
            </button>
          </div>
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
                    <td>
                      {item.Tasks === "" ? (
                        <span style={{ fontWeight: "bold", color: "#007bff" }}>
                          {item.TimeUtilized}
                        </span>
                      ) : (
                        item.TimeUtilized
                      )}
                    </td>
                    <td>{item.Status}</td>
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

export default App;
