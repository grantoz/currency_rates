import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { CURRENCY_OPTIONS } from "../constants/currencies";
import { getCurrencyName } from "../utils/locale";

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function CurrencySelect({
  value,
  onChange,
  label = "Currency",
  disabled = false,
}: CurrencySelectProps) {
  return (
    <TextField
      select
      label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 220 }}
    >
      {CURRENCY_OPTIONS.map((code) => (
        <MenuItem key={code} value={code}>
          {code} — {getCurrencyName(code)}
        </MenuItem>
      ))}
    </TextField>
  );
}
