import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function App() {
  const [file, setFile] = useState(null);
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
    jsonData.forEach((row) => {
      const level = row[0]; // Level column
      const value = row[1]; // Users/issues/CurrentStatus column
      const timespend = row[3]; // Time Spent column

      if (level === 0) {
        // Level 0 indicates a name
        currentName = value; // Store the current name
      } else if (level === 1) {
        // Level 1 indicates a task
        formattedData.push({
          SNo: formattedData.length + 1,
          ResourceName: currentName,
          Tasks: value,
          TimeUtilized: timespend,
          Status: "",
        });
      } else if (level === 2) {
        // Level 2 indicates the status of the task
        if (formattedData.length > 0) {
          formattedData[formattedData.length - 1].Status = value;
        }
      }
    });

    setData(formattedData);
  };

  const exportToExcel = () => {
    const formattedDataForExport = data.map((item, index) => {
      // Keep track of the previous resource name
      let previousName = index > 0 ? data[index - 1].ResourceName : null;

      return {
        SNo: item.SNo,
        ResourceName:
          item.ResourceName === previousName ? "" : item.ResourceName,
        Tasks: item.Tasks,
        TimeUtilized: item.TimeUtilized,
        Status: item.Status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedDataForExport);
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
                <th>Time utilized</th>
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
