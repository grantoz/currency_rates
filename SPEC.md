# application spec

This FastAPI application will fetch exchange rates from the coinbase API at `GET https://api.coinbase.com/v2/exchange-rates`.

It will provide an endpoint `/exchange-rates` that returns the data in JSON format.

It will display these rates in a ReactJS app.

The ReactJS App will display a dashboard that will show the current exchange rates for various currencies.

The default selected currency will be for the User's current locale.

The application will also provide a dropdown menu allowing users to manually select from available currencies (USD, EUR, GBP, AUD, CAD, CHF, CNY, JPY, KRW, etc.) to view the exchange rates returned by the API against the selected currency in tabular format. The dropdown options are the joined set of all ISO 4217 fiat currencies and the top five cryptocurrencies (BTC, ETH, USDT, BNB, XRP).

The Coinbase API returns many lesser-known crypto instruments. The dashboard will default to showing only major instruments: fiat currencies (the full ISO 4217 set, e.g. USD, GBP, EUR) plus the top five cryptocurrencies (BTC, ETH, USDT, BNB, XRP). A toggle control on the dashboard defaults to this majors-only view, with the option to display all results returned by the Coinbase API.

The dashboard will also provide a text filter: as the user types currency code letters, the table narrows to instruments whose code starts with the typed letters (case-insensitive, from the leftmost letter — typing "A" shows AED, ARS, AUD; adding "E" narrows to AED). If nothing matches, the table displays "no match for [input]".

The application will cache exchange rate data in memory for 10 minutes to reduce API calls and improve performance.

Each API feature will have tests.

The ReactJS frontend will also have unit tests for components and integration tests for API communication.

The ReactJS app should be built with modularity in mind, so the codebase is organized into reusable, maintainable components.

The App should show a welcome page on load, and a button that takes the user to the exchange rates dashboard.

## Requirements

Use React for the frontend, FastAPI for the backend
Use HTTPX2 for fetching data
API calls from the frontend should pass through FastAPI
Use a styling library to provide the page presentation. Material-UI would be a good choice.
Render the retrieved results clearly on the page, including an appropriate loading state and an observable error state.

## Error Handling

The application must handle API errors gracefully by displaying user-friendly error messages when the Coinbase API is unreachable or returns invalid data. It should also implement retry logic with exponential backoff for transient network failures.

## Ambiguity

If anything is not clear, prompt the user.

## Approach

Additional instruction: create an implementation plan so that the application can be created step-by-step, and save work as you go. Also, do spin up more agents to parallelise this task.
