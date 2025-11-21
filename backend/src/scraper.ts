import puppeteer from "puppeteer";

const BASE_URL = "https://bilety.cracovia.pl";

async function scrapeTickets() {
    console.log("🚀 Starting Cracovia tickets scraper...");

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Set realistic headers to avoid detection
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        });

        // Step 1: Navigate to the main page
        console.log(`📄 Navigating to ${BASE_URL}...`);
        await page.goto(BASE_URL, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log("✅ Main page loaded");

        // Step 2: Find the first event link
        console.log("🔍 Looking for first event with eventId...");

        const firstEventLink = await page.evaluate(() => {
            const link = document.querySelector('a[href*="eventId"]') as HTMLAnchorElement;
            if (!link) return null;
            return link.getAttribute('href');
        });

        if (!firstEventLink) {
            throw new Error("❌ No event found with eventId on the page");
        }

        const eventIdMatch = firstEventLink.match(/eventId=(\d+)/);
        if (!eventIdMatch) {
            throw new Error("❌ Could not extract eventId from link");
        }

        const eventId = eventIdMatch[1];
        console.log(`✅ Found first event: eventId=${eventId}`);
        console.log(`   Link: ${firstEventLink}`);

        // Step 3: Navigate to the stadium page
        const stadiumUrl = `${BASE_URL}${firstEventLink}`;
        console.log(`\n📄 Navigating to stadium page: ${stadiumUrl}...`);

        // Set referer to the main page
        await page.setExtraHTTPHeaders({
            ...await page.evaluate(() => ({})), // Keep existing headers
            'Referer': BASE_URL
        });

        await page.goto(stadiumUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log("✅ Stadium page loaded");

        // Step 4: Get the full HTML
        const html = await page.content();

        console.log("\n" + "=".repeat(80));
        console.log(`📋 HTML Content of ${stadiumUrl}`);
        console.log("=".repeat(80) + "\n");
        console.log(html);
        console.log("\n" + "=".repeat(80));
        console.log(`✅ Scraping completed for eventId=${eventId}`);
        console.log("=".repeat(80));

    } catch (error) {
        console.error("❌ Error during scraping:", error);
        throw error;
    } finally {
        await browser.close();
        console.log("\n🏁 Browser closed");
    }
}

// Run the scraper
scrapeTickets().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
