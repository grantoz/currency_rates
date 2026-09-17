import TextField from "@mui/material/TextField";

interface CurrencySearchProps {
  query: string;
  onChange: (query: string) => void;
  label?: string;
}

export default function CurrencySearch({
  query,
  onChange,
  label = "Filter currencies",
}: CurrencySearchProps) {
  return (
    <TextField
      size="small"
      label={label}
      placeholder="e.g. EUR"
      value={query}
      onChange={(event) => onChange(event.target.value)}
      sx={{ width: 220 }}
    />
  );
}
