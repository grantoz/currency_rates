import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { formatRate, formatTimestamp } from "../utils/format";
import { getCurrencyName } from "../utils/locale";

interface RatesTableProps {
  baseCurrency: string;
  rates: Record<string, string>;
  fetchedAt: string;
  cached?: boolean;
  noMatchFor?: string;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function RatesTable({
  baseCurrency,
  rates,
  fetchedAt,
  cached = false,
  noMatchFor,
}: RatesTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  const rows = useMemo(() => {
    return Object.entries(rates)
      .map(([code, rate]) => ({ code, rate }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [rates]);

  const pagedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={2}>
      <TableContainer sx={{ maxHeight: 480 }}>
        <Table stickyHeader size="small" aria-label="exchange rates">
          <TableHead>
            <TableRow>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Rate per 1 {baseCurrency}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map(({ code, rate }) => (
              <TableRow
                key={code}
                sx={code === baseCurrency ? { backgroundColor: "action.selected" } : undefined}
              >
                <TableCell>
                  <strong>{code}</strong> · {getCurrencyName(code)}
                  {code === baseCurrency && (
                    <Chip size="small" color="secondary" label="base" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell align="right">{formatRate(rate)}</TableCell>
              </TableRow>
            ))}
            {pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  {noMatchFor ? `No match for ${noMatchFor}` : "No exchange rates available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 2, pb: 1, display: "block" }}
      >
        Last updated {formatTimestamp(fetchedAt)}
        {cached ? " · served from cache" : ""}
      </Typography>
    </Paper>
  );
}
