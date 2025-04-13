// server.js
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();

app.use(cors()); // <--- Enable CORS for all routes
const port = 3000;

app.use(express.json());

// Constant data to be included in each item
const constantData = {
  "Region": "Middle East",
  "Market": "Iran",
  "Source time": "GMT+2",
  "Channel": "Varzesh (IRN)",
  "Feed": "FTA",
  "TV_Ownership": "PMS",
  "Channel Type": "Sports",
  "Channel Language": "Persian",
};

app.post('/varzesh', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url in request body.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 120000
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/108.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.table', { timeout: 120000 });

    // Collect table data
    const tableData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr.vertical-middle'));
      return rows.map(row => ({
        title: row.querySelector('h5.titlecls')?.textContent?.trim() || '',
        description: row.querySelector('span.extracls')?.textContent?.trim() || '',
        time: row.querySelector('td.vertical-middle > div')?.textContent?.trim() || '',
        duration: row.querySelector('.conductor-archive-page--duration div')?.textContent?.trim() || '',
        imageUrl: row.querySelector('td.program-image img')?.src || ''
      }));
    });

    // Generate dynamic time-related data
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Month is 0-indexed
    const day = now.getDate();
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${String(year).slice(-2)}`;

    // Combine scraped data with constant and dynamic data for each item
    const responses = tableData.map(item => ({
      ...constantData,
      Year: year,
      Month: month,
      Day: day,
      Date: formattedDate,
      title: item.title,
      description: item.description,
      time: item.time,
      duration: item.duration,
      imageUrl: item.imageUrl,
    }));

    // Respond with JSON directly as an array of objects
    return res.json(responses);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.toString() });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});