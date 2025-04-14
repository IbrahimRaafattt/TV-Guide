// routes/varzesh.js
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import translatePersianToEnglish from './translate.js';
const router = express.Router();

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

function timeToMinutes(timeString) {
  if (!timeString) {
    return 0;
  }
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

function durationToMinutes(durationString) {
  if (!durationString) {
    return 0;
  }
  const parts = durationString.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 60 + minutes + Math.round(seconds / 60); // Round seconds to the nearest minute
  } else if (parts.length === 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  } else if (parts.length === 1) {
    return parseInt(parts[0], 10) || 0; // Assuming it's just minutes
  }
  return 0;
}

function calculateEndTime(startTime, duration) {
  const startTimeMinutes = timeToMinutes(startTime);
  const durationMinutes = durationToMinutes(duration);
  const endTimeInMinutes = startTimeMinutes + durationMinutes;

  const endHours = Math.floor(endTimeInMinutes / 60) % 24;
  const endMinutes = endTimeInMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url in request body.' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 120000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended for server environments
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

    // Combine scraped data with constant and dynamic data, and translate
    const responses = await Promise.all(tableData.map(async item => {
      const englishTitle = await translatePersianToEnglish(item.title);
      const englishDescription = await translatePersianToEnglish(item.description);
      const durationInMinutes = durationToMinutes(item.duration);
      const endTime = calculateEndTime(item.time, item.duration);

      return {
        ...constantData,
        Year: year,
        Month: month,
        Day: day,
        Date: formattedDate,
        title: item.title, // Original Persian title
        englishTitle: englishTitle,
        description: item.description, // Original Persian description
        englishDescription: englishDescription,
        start_Time: item.time,
        duration: item.duration,
        durationInMinutes: durationInMinutes,
        endTime: endTime,
        imageUrl: item.imageUrl,
      };
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

export default router;