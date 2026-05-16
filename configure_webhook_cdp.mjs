import { chromium } from 'playwright';
import fs from 'fs';

async function configureNotion() {
    console.log("🔗 Connecting to active Chrome instance via CDP (port 9222)...");
    let browser;
    try {
        browser = await chromium.connectOverCDP('http://localhost:9222');
    } catch (err) {
        console.error("❌ Failed to connect to CDP on 9222. Ensure Chrome is running with --remote-debugging-port=9222");
        process.exit(1);
    }
    
    const context = browser.contexts()[0];
    
    console.log("Opening new tab to exact Database URL...");
    const DATABASE_ID = "d9dfb107ab514ccfa6e7b6863ec0de2b";
    const page = await context.newPage();
    await page.goto(`https://www.notion.so/${DATABASE_ID}`);
    
    console.log("⏳ Waiting 15 seconds for Database grid to render fully...");
    await page.waitForTimeout(15000); 
    
    try {
        console.log("📸 Taking initial snapshot...");
        await page.screenshot({ path: 'notion_initial.png' });

        console.log("⚡ Looking for the 'Automations' lightning bolt icon...");
        const automationsBtn = page.locator('[aria-label="Automations"]').first();
        if (await automationsBtn.count() > 0) {
            await automationsBtn.click();
        } else {
            console.log("Using fallback button role for Automations...");
            await page.getByRole('button', { name: /Automations/i }).first().click();
        }
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'notion_step1.png' });

        console.log("➕ Clicking 'New automation'...");
        await page.getByText('New automation', { exact: false }).first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'notion_step2.png' });

        console.log("🎯 Setting Trigger -> Status...");
        await page.getByText('Add trigger').first().click();
        await page.waitForTimeout(1500);
        
        console.log("Clicking 'Status' property...");
        await page.getByText('Status', { exact: true }).first().click();
        await page.waitForTimeout(1500);
        
        console.log("Clicking 'Approved' option...");
        await page.getByText('Approved', { exact: true }).first().click();
        
        await page.keyboard.press('Escape'); // Close dropdown
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'notion_step3.png' });

        console.log("🚀 Setting Action -> Send webhook...");
        await page.getByText('Add action').first().click();
        await page.waitForTimeout(1500);
        await page.getByText('Send webhook', { exact: false }).first().click();
        await page.waitForTimeout(1500);

        console.log("🔗 Injecting Webhook payload...");
        const webhookUrl = 'https://bluejax-n8n-tunnel.trycloudflare.com/webhook/notion-status-approved';
        await page.keyboard.type(webhookUrl);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'notion_step4.png' });

        console.log("💾 Saving Automation (Click Create)...");
        await page.getByText('Create', { exact: true }).first().click();
        await page.waitForTimeout(1000);
        
        console.log("📸 Final snapshot...");
        await page.screenshot({ path: 'notion_success.png' });
        console.log("✅ Successfully configured Webhook Automation in Notion!");

    } catch (e) {
        console.error("❌ UI interaction failed:", e.message);
        await page.screenshot({ path: 'notion_error.png' });
    } finally {
        await browser.close();
    }
}

configureNotion().catch(console.error);
