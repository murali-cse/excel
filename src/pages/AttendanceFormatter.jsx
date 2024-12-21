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
    const headers = jsonData[0];

    const employeeData = jsonData.slice(3).map((row) => {
      const employee = {};
      headers.forEach((header, index) => {
        employee[header] = row[index];
      });
      return employee;
    });

    console.log("Employee Data", employeeData);

    const updatedEmployees = employeeData.map((emp, index) => {
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

      // Convert half-days to casual leave
      const halfDaysToLeave = Math.floor(halfDays / 2); // 2 half-days = 1 leave
      const remainingHalfDay = halfDays % 2 === 1 ? 0.5 : 0; // Add 0.5 leave if 1 half-day remains
      const totalCasualLeave = casualLeave + halfDaysToLeave + remainingHalfDay; // Total adjusted casual leaves

      // Deduct salary for excess casual leave
      let clDeduction = 0;
      let excessCL = 0;
      if (totalCasualLeave > emp["Total CL"]) {
        excessCL = totalCasualLeave - emp["Total CL"]; // Calculate excess casual leave
        console.log("Excess CL", excessCL);

        console.log("totalCasualLeave", totalCasualLeave);
        const dailySalary = emp["Gross"] / emp["Total Month Days"]; // Calculate daily salary
        clDeduction = excessCL * dailySalary; // Deduction for excess casual leave
      }

      // Deduct salary for excess sick leave
      let slDeduction = 0;
      if (sickLeave > emp["Balance SL"]) {
        const excessSL = sickLeave - emp["Balance SL"]; // Calculate excess sick leave
        const dailySalary = emp["Gross"] / emp["Total Month Days"]; // Calculate daily salary
        slDeduction = excessSL * dailySalary; // Deduction for excess sick leave
      }

      // Check if present days exceed total working days and calculate additional salary
      let additionalSalary = 0;
      let extraDays = 0;
      const totalWorkingDays = emp["Total Month Days"]; // Assuming provided total working days
      const dailySalary = emp["Gross"] / totalWorkingDays; // Daily salary calculation

      if (presentDays > totalWorkingDays) {
        extraDays = presentDays - totalWorkingDays;
        additionalSalary = extraDays * dailySalary;
      }

      // Calculate net salary
      const netSalary =
        emp["Gross"] -
        emp["Dedection PF"] -
        clDeduction - // Deduction for excess casual leave
        slDeduction + // Deduction for excess sick leave
        additionalSalary;

      return {
        SNo: index + 1,
        Name: emp["NAME"],
        DaysPresent: presentDays,
        HalfDayCount: halfDays,
        CasualLeavesTaken: totalCasualLeave, // Adjusted casual leave with half-days
        SickLeavesTaken: sickLeave,
        ExcessCL: excessCL, // Track excess casual leave
        ExcessSL:
          sickLeave > emp["Balance SL"] ? sickLeave - emp["Balance SL"] : 0, // Track excess sick leave
        GrossSalary: emp["Gross"],
        Deduction: emp["Dedection PF"],
        CL_LOP: Math.round(clDeduction), // Deduction for casual leave
        SL_LOP: Math.round(slDeduction), // Deduction for sick leave
        OTinDays: extraDays ?? "-",
        NetSalary: Math.round(netSalary),
      };
    });

    const filteredEmployees = updatedEmployees.filter(
      (emp) =>
        emp.DaysPresent !== 0 ||
        emp.HalfDayCount !== 0 ||
        emp.SickLeavesTaken !== 0 ||
        emp.TotalCasualLeaves !== 0
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
            Attendance Report
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
