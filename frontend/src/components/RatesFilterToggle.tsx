import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

interface RatesFilterToggleProps {
  majorsOnly: boolean;
  onToggle: (majorsOnly: boolean) => void;
}

export default function RatesFilterToggle({ majorsOnly, onToggle }: RatesFilterToggleProps) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={majorsOnly}
          onChange={(event) => onToggle(event.target.checked)}
        />
      }
      label="Majors only"
    />
  );
}
