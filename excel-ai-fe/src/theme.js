import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#f9f9f9",
        },
        columnHeaders: {
          backgroundColor: "#007bff",
          color: "#fff",
          fontWeight: "bold",
        },
        row: {
          "&:hover": {
            backgroundColor: "#e6f7ff",
          },
        },
      },
    },
  },
});

export default theme;
