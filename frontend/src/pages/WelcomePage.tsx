import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Stack spacing={3} alignItems="center">
        <TrendingUpIcon color="primary" sx={{ fontSize: 64 }} />
        <Typography variant="h2" component="h1">
          Welcome
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track live exchange rates for major world currencies, sourced from the
          Coinbase API and refreshed every 10 minutes.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate("/rates")}>
          View Exchange Rates
        </Button>
      </Stack>
    </Container>
  );
}
