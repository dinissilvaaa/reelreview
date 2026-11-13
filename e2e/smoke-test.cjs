// ============================================================================
// e2e/smoke-test.cjs
// End-to-end (E2E) smoke test. It opens a real browser (your installed Chrome
// or Edge, in headless mode) and clicks through the main user flows of the
// RUNNING application, exactly like a person would.
//
// Requirements: the app must be running (Docker on :8080 or dev on :5173)
// with the demo data (SEED_ON_START=true).
//
// Usage:
//   cd e2e
//   npm install
//   npm test                                   (tests http://localhost:8080)
//   APP_URL=http://localhost:5173 npm test     (macOS/Linux, dev server)
//   $env:APP_URL="http://localhost:5173"; npm test   (Windows PowerShell)
// Optional env vars: CHROME_PATH (browser executable), SCREENSHOTS_DIR (save PNGs)
// ============================================================================

const fs = require('node:fs'); // File system (to find the browser)
const path = require('node:path'); // Path helpers
const puppeteer = require('puppeteer-core'); // Controls Chrome through the DevTools protocol

const APP_URL = (process.env.APP_URL || 'http://localhost:8080').replace(/\/$/, ''); // App under test
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || ''; // '' = do not save screenshots
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@reelreview.com', password: process.env.ADMIN_PASSWORD || 'Admin123!' }; // Seeded admin

// Usual browser locations on Windows, macOS and Linux
const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH, // Explicit path wins
  'C:/Program Files/Google/Chrome/Application/chrome.exe', // Chrome (Windows)
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', // Edge (Windows)
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Chrome (macOS)
  '/usr/bin/google-chrome', // Chrome (Linux)
  '/usr/bin/chromium-browser', // Chromium (Linux)
  '/usr/bin/chromium', // Chromium (Linux, other distros)
].filter(Boolean); // Drop the undefined CHROME_PATH

let passed = 0; // Number of successful checks

/** Prints a green tick and counts the check. */
function ok(message) {
  passed += 1; // Count it
  console.log(`  ✔ ${message}`); // Show it
}

/** Throws (failing the test) when the condition is false. */
function expect(condition, message) {
  if (!condition) throw new Error(`Expectation failed: ${message}`); // Stop with a clear message
  ok(message); // Otherwise report success
}

/** Clicks the first <button> whose visible text is exactly `text`. */
async function clickButton(page, text) {
  await page.evaluate((label) => {
    const button = [...document.querySelectorAll('button')].find((element) => element.textContent.trim() === label); // Find by text
    if (!button) throw new Error(`Button "${label}" not found`); // Helpful error
    button.click(); // Click it
  }, text);
}

/**
 * Waits until FILTERED browse results are on screen: the results section is not
 * loading (aria-busy="false") and already shows the "Clear filters" button,
 * which only appears once a search/genre filter has been applied.
 */
async function waitForFilteredResults(page) {
  await page.waitForFunction(() => {
    const section = document.querySelector('section[aria-busy]'); // Results area of HomePage
    return section !== null && section.getAttribute('aria-busy') === 'false' && section.textContent.includes('Clear filters'); // Loaded + filtered
  });
}

/** Saves a screenshot when SCREENSHOTS_DIR is set. */
async function snap(page, name) {
  if (!SCREENSHOTS_DIR) return; // Screenshots disabled
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true }); // Make sure the folder exists
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true }); // Whole page
}

async function main() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => fs.existsSync(candidate)); // First browser that exists
  if (!executablePath) throw new Error('No Chrome/Edge found. Set CHROME_PATH to your browser executable.'); // Nothing installed

  console.log(`Testing ${APP_URL} with ${executablePath}\n`); // What we are doing
  const browser = await puppeteer.launch({ executablePath, headless: true }); // Start an invisible browser
  const page = await browser.newPage(); // Open a tab
  const pageErrors = []; // JavaScript errors thrown by the app
  page.on('pageerror', (error) => pageErrors.push(error.message)); // Collect them
  page.on('dialog', (dialog) => dialog.accept()); // Automatically confirm "Are you sure?" dialogs
  await page.setViewport({ width: 1366, height: 900 }); // Desktop size

  try {
    console.log('Browse & search');
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle0' }); // Open the home page and wait for the API calls
    const cardCount = await page.$$eval('a[href^="/movies/"]', (cards) => cards.length); // Movie cards on the page
    expect(cardCount > 0, `home page shows ${cardCount} movie cards`);
    await snap(page, 'home');

    await clickButton(page, 'Sci-Fi'); // Genre chip
    await page.waitForFunction(() => location.search.includes('genre=Sci-Fi')); // URL updated
    await waitForFilteredResults(page); // Filtered results loaded
    const pressed = await page.$eval('button[aria-pressed="true"]', (chip) => chip.textContent); // Highlighted chip
    expect(pressed === 'Sci-Fi', 'genre filter updates the URL and highlights the "Sci-Fi" chip');

    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle0' }); // Reset filters
    await page.type('#movie-search', 'nolan'); // Type in the search box
    await page.keyboard.press('Enter'); // Submit
    await page.waitForFunction(() => location.search.includes('search=nolan')); // URL updated
    await waitForFilteredResults(page); // Filtered results loaded
    const titles = await page.$$eval('a[href^="/movies/"] h3', (headings) => headings.map((heading) => heading.textContent)); // Result titles
    expect(titles.includes('Inception'), `search "nolan" finds: ${titles.join(', ')}`);

    console.log('Movie details');
    await page.click('a[href^="/movies/"]'); // Open the first result
    await page.waitForSelector('#reviews-title'); // Details page rendered
    const movieTitle = await page.$eval('h1', (heading) => heading.textContent); // Movie title
    expect(Boolean(movieTitle), `details page opens for "${movieTitle}"`);

    console.log('Authentication');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' }); // Login page
    await page.click('button[type="submit"]'); // Submit an empty form
    const fieldErrors = await page.$$eval('.field-error', (errors) => errors.length); // Client-side validation messages
    expect(fieldErrors === 2, 'empty login form shows 2 validation errors');
    await page.type('#email', ADMIN.email); // Correct email
    await page.type('#password', 'definitely-wrong'); // Wrong password
    await page.click('button[type="submit"]'); // Submit
    await page.waitForSelector('[role="alert"]'); // Server error appears
    expect(true, 'wrong password shows the server error');
    await page.locator('#password').fill(ADMIN.password); // fill() clears the wrong password and types the correct one
    await page.click('button[type="submit"]'); // Submit
    await page.waitForSelector('a[href="/admin"]'); // Navbar now shows "Admin panel"
    expect(true, 'admin can log in');

    console.log('Admin: create a movie');
    const testTitle = `E2E Test Movie ${Date.now()}`; // Unique title
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle0' }); // Admin panel
    await clickButton(page, '+ Add movie'); // Open the form
    await page.waitForSelector('#movie-title'); // Form visible
    await page.type('#movie-title', testTitle); // Fill in the fields...
    await page.type('#movie-director', 'Automated Tester');
    await page.type('#movie-releaseYear', '2024');
    await page.type('#movie-description', 'A movie created by the end-to-end smoke test.');
    await clickButton(page, 'Drama'); // Choose a genre
    await clickButton(page, 'Add movie'); // Save
    await page.waitForFunction(() => document.body.textContent.includes('was added to the catalogue')); // Success message
    expect(true, 'admin can create a movie');

    console.log('Reviews');
    await page.goto(`${APP_URL}/?search=${encodeURIComponent('E2E Test Movie')}`, { waitUntil: 'networkidle0' }); // Find it
    await page.click('a[href^="/movies/"]'); // Open it
    await page.waitForSelector('[role="radiogroup"]'); // Review form visible
    await page.click('button[aria-label="4 stars"]'); // Pick 4 stars
    await page.type('#review-comment', 'Written by the E2E test.'); // Comment
    await clickButton(page, 'Publish review'); // Submit
    await page.waitForFunction(() => document.body.textContent.includes('Your review has been published')); // Success message
    const average = await page.$eval('p.text-5xl', (element) => element.textContent); // Big average number
    expect(average === '4.0', `review published and the average became ${average}`);
    await snap(page, 'movie-details');

    console.log('Admin: delete the test movie');
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle0' }); // Admin panel
    await page.type('#admin-search', 'E2E Test Movie'); // Find the test movie
    await clickButton(page, 'Search'); // Apply the search
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('table tbody tr')]; // Table rows
      return rows.length === 1 && rows[0].textContent.includes('E2E Test Movie'); // Only the test movie is listed
    });
    await clickButton(page, 'Delete'); // The confirm() dialog is accepted automatically
    await page.waitForFunction(() => document.body.textContent.includes('was deleted')); // Success message
    expect(true, 'admin can delete the movie (and its reviews)');

    console.log('Responsive layout & 404');
    await page.setViewport({ width: 390, height: 844, isMobile: true }); // Phone size
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle0' }); // Home page
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth); // Horizontal scroll?
    expect(!overflow, 'no horizontal scrolling on a 390px wide phone');
    await page.click('button[aria-controls="mobile-menu"]'); // Hamburger button
    await page.waitForSelector('#mobile-menu'); // Menu opened
    expect(true, 'mobile menu opens');
    await page.goto(`${APP_URL}/this-page-does-not-exist`, { waitUntil: 'networkidle0' }); // Unknown URL
    expect((await page.$eval('main', (main) => main.textContent)).includes('404'), 'unknown routes show the 404 page');

    expect(pageErrors.length === 0, `no JavaScript errors in the page${pageErrors.length ? `: ${pageErrors.join(' | ')}` : ''}`);
    console.log(`\nAll ${passed} checks passed ✅`); // Summary
  } finally {
    await browser.close(); // Always close the browser
  }
}

main().catch((error) => {
  console.error(`\n❌ E2E test failed: ${error.message}`); // What went wrong
  process.exit(1); // Non-zero exit code = failure
});
