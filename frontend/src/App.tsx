import Box from "@mui/material/Box";
import { Navigate, Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import ExchangeRatesPage from "./pages/ExchangeRatesPage";
import WelcomePage from "./pages/WelcomePage";

export default function App() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/rates" element={<ExchangeRatesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
