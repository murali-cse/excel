import React, { useState } from "react";
import * as XLSX from "xlsx";

const AttendanceFormatter = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processData(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  };

  const processData = (jsonData) => {
    const headers = jsonData[3];

    const employeeData = jsonData.slice(5).map((row) => {
      const employee = {};
      headers.forEach((header, index) => {
        employee[header] = row[index];
      });
      return employee;
    });

    console.log("employeeData", employeeData);

    const updatedEmployees = employeeData.map((emp) => {
      // Initialize counters
      let presentDays = 0;
      let halfDays = 0;
      let casualLeave = 0;
      let sickLeave = 0;

      // Iterate over each key in the employee object
      for (const key in emp) {
        if (emp[key] === "P" || emp[key] === "WFH") {
          presentDays++;
        }
        if (emp[key] === "CL") {
          casualLeave++;
        }
        if (emp[key] === "SL") {
          sickLeave++;
        }
        if (emp[key] === "HD") {
          halfDays++;
        }
      }

      // Convert half-days to casual leave (2 half-days = 1 casual leave)
      casualLeave += Math.floor(halfDays / 2);

      // Deduct salary for any remaining single half-day
      let halfDayDeduction = 0;
      if (halfDays % 2 === 1) {
        const totalWorkingDays = 22; // Adjust this based on your month
        const dailySalary = emp["Gross Salary"] / totalWorkingDays;
        halfDayDeduction = dailySalary / 2; // Deduction for a single half-day
      }

      // Calculate total combined leave (casual + sick)
      const totalLeave = casualLeave + sickLeave;

      // Determine excess leave only if the total combined leave exceeds 2
      let excessLeave = 0;
      if (totalLeave > 2) {
        excessLeave = totalLeave - 2; // Only the excess amount beyond 2
      }

      // Total working days in the month
      const totalWorkingDays = 22; // Assuming 22 working days in the month
      const dailySalary = emp["Gross Salary"] / totalWorkingDays;
      const leaveDeduction = excessLeave * dailySalary; // Deduct salary for excess leave

      // Check if present days exceed total working days and calculate additional salary
      let additionalSalary = 0;
      let extraDays = 0;
      if (presentDays > totalWorkingDays) {
        extraDays = presentDays - totalWorkingDays;
        additionalSalary = extraDays * dailySalary;
      }

      // Calculate net salary
      const netSalary =
        emp["Gross Salary"] -
        emp["Dedection"] -
        leaveDeduction -
        halfDayDeduction +
        additionalSalary;

      return {
        Name: emp["Employee Names"],
        GrossSalary: emp["Gross Salary"],
        PresentDays: presentDays,
        HalfDays: halfDays,
        ExtraDays: extraDays ?? "-",
        TotalSickLeave: sickLeave,
        TotalCasualLeave: casualLeave,
        TotalLeave: totalLeave, // Combined total leave
        ExcessLeave: excessLeave, // Only excess leave beyond 2
        LeaveDeduction: Math.round(leaveDeduction), // Deduction based on excess leave
        HalfDayDeduction: Math.round(halfDayDeduction), // Deduction for single half-day
        AdditionalSalary: Math.round(additionalSalary), // Additional salary for extra days
        NetSalary: Math.round(netSalary),
      };
    });

    console.log("updatedEmployees", updatedEmployees);

    // Filter out employees who might not have attendance data
    const filteredEmployees = updatedEmployees.filter(
      (emp) =>
        emp.PresentDays !== 0 ||
        emp.HalfDays !== 0 ||
        emp.TotalSickLeave !== 0 ||
        emp.TotalCasualLeave !== 0
    );

    setData(filteredEmployees);
  };

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Attendance");

    // Export the updated Excel file
    XLSX.writeFile(workbook, `Formatted_${fileName}`);
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <div className="flex row justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif pb-4 text-gray-800 border-b-2 border-gray-300 mb-4">
            Attendance Formatter
          </h1>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
        {data.length > 0 && (
          <div>
            <button
              className="bg-blue-700 text-white "
              onClick={handleDownload}
              disabled={data.length === 0}
            >
              Download Updated File
            </button>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="overflow-x-auto overflow-y-auto lg:h-[47rem]">
          {/* Set a fixed height for vertical scrolling */}
          <table className="min-w-full border-collapse bg-white shadow-lg">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th
                    className="px-4 py-2 min-w-[7.5rem] text-left font-medium border-b border-gray-300"
                    key={key}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((emp, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50">
                  {Object.values(emp).map((value, idx) => (
                    <td
                      className="px-4 py-2 border-b border-gray-300 text-gray-700"
                      key={idx}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceFormatter;
