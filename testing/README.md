# Testing assets

This folder keeps the repeatable test definitions used for the Orbit OCRS report.

## Functional testing with Selenium IDE

Open `selenium/orbit-ocrs-functional-tests.side` from Selenium IDE. The suite uses
`http://localhost:3000` as its base URL and tests only safe public/preview flows, so
it does not contain a username, password, or secret key.

Before running it:

1. Start Docker Desktop.
2. Run `npm run db:start`.
3. Run `npm run db:import-csv`.
4. Run `npm run dev` in a second terminal.
5. Confirm `http://localhost:3000` opens in the browser.

The course-search tests set React input values with JavaScript and dispatch an
`input` event. This avoids the known Selenium IDE/macOS `initKeyEvent is not a
function` problem.

## Performance testing with JMeter

Open `jmeter/orbit-ocrs-load-test.jmx` in Apache JMeter 5.6.x. The supplied plan
uses 20 virtual users, a 10-second ramp-up, and 5 loops. Each loop requests the
landing page, Student preview, and Registrar preview, for 300 total HTTP samples.

For a classroom screenshot, run the plan in the JMeter GUI and open **Aggregate
Report**. For the most reliable saved result, run it from this project folder:

```bash
mkdir -p testing/jmeter/results
jmeter -n -t testing/jmeter/orbit-ocrs-load-test.jmx \
  -l testing/jmeter/results/orbit-results.jtl \
  -e -o testing/jmeter/results/html-report
```

Generated result files are intentionally ignored by Git because they vary on
every computer. Keep the screenshots and final measurements with the report.

