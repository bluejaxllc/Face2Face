import { chromium } from 'playwright';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables from root of project
dotenv.config({ path: 'C:/Users/edgar/OneDrive/Desktop/Face 2 Face/.env' });

const { Client } = pg;

async function run() {
  console.log('Database URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`API REQUEST: ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`API RESPONSE: ${res.status()} ${res.url()}`);
    }
  });

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('Navigating to http://localhost:5000/auth ...');
    await page.goto('http://localhost:5000/auth');
    await page.waitForTimeout(1000);

    // Switch to Register tab
    console.log('Switching to Register tab...');
    await page.click('text=Register');
    await page.waitForTimeout(1000);

    const username = 'testuser_' + Date.now();
    console.log(`Filling registration form for ${username}...`);

    // Step 0: Login details
    await page.fill('input[placeholder="Enter username"]', username);
    await page.fill('input[placeholder="Enter password"]', 'password123');
    await page.fill('input[placeholder="Confirm password"]', 'password123');
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 1: Personal details
    await page.fill('input[placeholder="Enter first name"]', 'Test');
    await page.fill('input[placeholder="Enter last name"]', 'User');
    await page.fill('input[placeholder="you@example.com"]', `test_${Date.now()}@example.com`);
    await page.fill('input[placeholder="(555) 000-0000"]', '5551234567');
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 2: Preferences
    // Sex Select dropdown
    await page.click('button:has-text("Select Sex")');
    await page.click('span:has-text("Male")');
    await page.waitForTimeout(500);
    
    console.log('Submitting registration...');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);

    console.log('Directly verifying phone number and profile in the database...');
    const dbRes = await client.query(
      `UPDATE users 
       SET "isPhoneVerified" = true, "profileCompleted" = true, "safetyAcknowledged" = true 
       WHERE username = $1 
       RETURNING *`, 
      [username]
    );
    console.log('DB Update Row Count:', dbRes.rowCount);

    // Go to map (or refresh the page)
    console.log('Refreshing page to reload auth state with verified status...');
    await page.goto('http://localhost:5000/map');
    
    console.log('Waiting for map URL...');
    await page.waitForURL('**/map', { timeout: 10000 });
    console.log('Successfully registered and arrived on map!');
    await page.waitForTimeout(2000);

    // Test transition from Map to Profile
    console.log('--- NAVIGATING TO PROFILE ---');
    await page.click('text=PROFILE');
    await page.waitForTimeout(2000);
    console.log('Current URL after Profile click:', page.url());

    // Test transition from Profile to Games
    console.log('--- NAVIGATING TO GAMES ---');
    await page.click('text=GAMES');
    await page.waitForTimeout(2000);
    console.log('Current URL after Games click:', page.url());

    // Test transition from Games to Explore
    console.log('--- NAVIGATING TO GROUP/LIST ---');
    await page.click('text=GROUP/LIST');
    await page.waitForTimeout(2000);
    console.log('Current URL after Group/List click:', page.url());

  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    await client.end();
    await browser.close();
  }
}

run();
