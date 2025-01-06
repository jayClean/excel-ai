import React from 'react';
import Button from '@mui/material/Button';
import './App.css';
import ExcelDataGrid from './components/ExcelDataGrid';
import theme from "./theme";

function App() {

  return (
      // <ThemeProvider theme={theme}>
      <div>
      <ExcelDataGrid />
    </div>
      // </ThemeProvider>
    
  );
}

export default App
