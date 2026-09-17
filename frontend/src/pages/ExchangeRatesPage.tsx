import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import CurrencySearch from "../components/CurrencySearch";
import CurrencySelect from "../components/CurrencySelect";
import ErrorAlert from "../components/ErrorAlert";
import LoadingIndicator from "../components/LoadingIndicator";
import RatesFilterToggle from "../components/RatesFilterToggle";
import RatesTable from "../components/RatesTable";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { filterRates, filterRatesByCode } from "../utils/filterRates";
import { getDefaultCurrency } from "../utils/locale";

export default function ExchangeRatesPage() {
  const [currency, setCurrency] = useState(() => getDefaultCurrency());
  const [majorsOnly, setMajorsOnly] = useState(true);
  const [codeFilter, setCodeFilter] = useState("");
  const { status, data, error, retry } = useExchangeRates(currency);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="h5" component="h1">
            Exchange Rates Dashboard
          </Typography>
          <CurrencySelect value={currency} onChange={setCurrency} label="Base currency" />
        </Stack>

        {status === "loading" && (
          <LoadingIndicator label={`Loading exchange rates for ${currency}…`} />
        )}
        {status === "error" && (
          <ErrorAlert message={error ?? "Unable to load exchange rates."} onRetry={retry} />
        )}
        {status === "success" && data && (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <CurrencySearch query={codeFilter} onChange={setCodeFilter} />
                <RatesFilterToggle majorsOnly={majorsOnly} onToggle={setMajorsOnly} />
              </Stack>
              {data.cached && <Chip size="small" label="cached" />}
            </Stack>
            <RatesTable
              key={`${data.currency}-${majorsOnly ? "majors" : "all"}-${codeFilter}`}
              baseCurrency={data.currency}
              rates={filterRatesByCode(filterRates(data.rates, majorsOnly), codeFilter)}
              fetchedAt={data.fetched_at}
              cached={data.cached}
              noMatchFor={codeFilter}
            />
          </>
        )}
      </Stack>
    </Container>
  );
}
