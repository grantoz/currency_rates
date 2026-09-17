import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface LoadingIndicatorProps {
  label?: string;
}

export default function LoadingIndicator({
  label = "Loading exchange rates…",
}: LoadingIndicatorProps) {
  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
      <CircularProgress aria-label={label} />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}
