import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, TextField, Typography, MenuItem, CircularProgress } from "@mui/material";
import * as XLSX from "xlsx";
import axios from "axios";
import './ExcelDataGrid.css';

const API_BASE_URL = "http://127.0.0.1:8000";

const ExcelDataGrid = () => {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [combineColumns, setCombineColumns] = useState({ column1: "", column2: "", newColumnName: "" });
  const [formula, setFormula] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      const gridColumns = headers.map((header, index) => ({
        field: header || `Column${index + 1}`,
        headerName: header || `Column ${index + 1}`,
        width: 150,
        editable: true,
      }));

      const gridRows = dataRows.map((row, id) => {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header || `Column${index + 1}`] = row[index] || "";
        });
        return { id, ...rowData };
      });

      setColumns(gridColumns);
      setRows(gridRows);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleAPIRequest = async (url, data, successCallback) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}${url}`, data, {
        headers: { "Content-Type": "application/json" },
      });
      successCallback(response.data);
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName || !rows.length) {
      alert("Please upload a file and provide a new column name.");
      return;
    }

    const requestData = {
      rows: rows,
      new_column_name: newColumnName,
      formula: formula, // Include formula in the request
    };

    handleAPIRequest("/process/add-column", requestData, (data) => {
      const updatedRows = data.rows.map((row, index) => ({
        id: index,
        ...row,
      }));
      setRows(updatedRows);

      const updatedColumns = data.columns.map((col, index) => ({
        field: col.field || `Column${index + 1}`,
        headerName: col.headerName || `Column ${index + 1}`,
        width: 150,
        editable: true,
      }));
      setColumns(updatedColumns);
    });
  };

  const handleFilterRows = () => {
    if (!filterValue || !rows.length) {
      alert("Please upload a file and provide a filter condition.");
      return;
    }

    const requestData = {
      rows: rows,
      filter_condition: filterValue,
    };

    handleAPIRequest("/process/filter-rows", requestData, (data) => {
      const updatedRows = data.rows.map((row, index) => ({
        id: index,
        ...row,
      }));
      setRows(updatedRows);
    });
  };

  const handleCombineColumns = () => {
    const { column1, column2, newColumnName } = combineColumns;
    if (!column1 || !column2 || !newColumnName || !rows.length) {
      alert("Please upload a file and provide all column details.");
      return;
    }

    const requestData = {
      rows: rows,
      column1: column1,
      column2: column2,
      new_column_name: newColumnName,
    };

    handleAPIRequest("/process/combine-columns", requestData, (data) => {
      const updatedRows = data.rows.map((row, index) => ({
        id: index,
        ...row,
      }));
      setRows(updatedRows);

      const updatedColumns = data.columns.map((col, index) => ({
        field: col.field || `Column${index + 1}`,
        headerName: col.headerName || `Column ${index + 1}`,
        width: 150,
        editable: true,
      }));
      setColumns(updatedColumns);
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Excel-AI</h1>
      <Box className="input-section">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </Box>

      <Box marginBottom={2} className="text-field-container" >
        <TextField
          label="New Column Name"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <TextField
          label="Formula (e.g., Income + Tax)"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" onClick={handleAddColumn} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Add Column"}
        </Button>
      </Box>

      <Box marginBottom={2} className="text-field-container">
        <TextField
          label="Filter Condition (e.g., Income > 5000)"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" onClick={handleFilterRows} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Filter Rows"}
        </Button>
      </Box>

      <Box marginBottom={2} className="text-field-container">
        <TextField
          label="Column 1"
          select
          value={combineColumns.column1}
          onChange={(e) => setCombineColumns({ ...combineColumns, column1: e.target.value })}
          style={{ marginRight: "10px" }}
        >
          {columns.map((col) => (
            <MenuItem key={col.field} value={col.field}>
              {col.headerName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Column 2"
          select
          value={combineColumns.column2}
          onChange={(e) => setCombineColumns({ ...combineColumns, column2: e.target.value })}
          style={{ marginRight: "10px" }}
        >
          {columns.map((col) => (
            <MenuItem key={col.field} value={col.field}>
              {col.headerName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="New Column Name"
          value={combineColumns.newColumnName}
          onChange={(e) => setCombineColumns({ ...combineColumns, newColumnName: e.target.value })}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" onClick={handleCombineColumns} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Combine Columns"}
        </Button>
      </Box>

      <div style={{ height: 600, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
      </div>
    </div>
  );
};

export default ExcelDataGrid;
