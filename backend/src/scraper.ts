import puppeteer from "puppeteer";



import { Pool } from 'pg';

const pool = new Pool({
    user: 'app',
    host: 'localhost',  // bo port wystawiony na Maca
    database: 'app',
    password: 'app',
    port: 5432,
});

async function createTable() {
    const client = await pool.connect();
    try {
        await client.query(`
  CREATE TABLE IF NOT EXISTS stadium_seats (
    id SERIAL PRIMARY KEY,
    club_label TEXT,
    total_places INT,
    available_places INT,
    sold_places INT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_label, created_at)
  );
`);

        console.log('✅ Table "stadium_seats" ensured!');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        client.release();
    }
}


interface StadiumData {
    clubLabel: string;
    totalPlaces: number;
    availablePlaces: number;
    soldPlaces: number;
    timestamp: Date;
}

// Funkcja wstawiająca dane
async function insertStadiumData(data: StadiumData) {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO stadium_seats (
                 club_label, total_places, available_places, sold_places, created_at
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING`,
            [
                data.clubLabel,
                data.totalPlaces,
                data.availablePlaces,
                data.soldPlaces,
                data.timestamp
            ]
        );
    } finally {
        client.release();
    }
}


const BASE_URL = "https://bilety.cracovia.pl";

interface Stadion {
    sectors?: Sector[];
}

interface Sector {
    seatsReservedFor: number;
}


interface Seats {
    seats?: any[]
}


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



        let seats: Seats | undefined = undefined as Seats | undefined;

        // Przechwytywanie response
        page.on('response', async (response) => {
            if (response.url().includes('/GetWGLSeats')) {
                try {
                    seats = await response.json() as Seats; // parsowanie JSON
                } catch (e) {
                    // Jeśli nie jest JSON, pobierz tekst
                    console.log('seats Text:', seats);
                }
            }
        });

        let stadion: Stadion | undefined = undefined as Stadion | undefined;;

        // Przechwytywanie response
        page.on('response', async (response) => {
            if (response.url().includes('/GetWGLSectorsInfo')) {
                try {
                    stadion = await response.json(); // parsowanie JSON
                } catch (e) {
                    // Jeśli nie jest JSON, pobierz tekst
                    stadion = await response.text() as Stadion;
                    console.log('stadion Text:', stadion);
                }
            }
        });


        await page.goto(stadiumUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const seatsCount = seats?.seats?.length ?? 0;
        const freeSeatsCount = (stadion?.['sectors'])?.map((s: any) => s.freeSeatsByPriceArea[0].freeSeatsNo).reduce((a: number, b: number) => a + b, 0) ?? 0;
        const soldSeatsCount = seatsCount - freeSeatsCount;

        console.log(`✅ Stadium page loaded, sectors info count: ${seatsCount}`);
        console.log(`🎟️ Available seats: ${freeSeatsCount}`);


        const stadiumData: StadiumData = {
            clubLabel: "Motor",   // lub pobierz dynamicznie jeśli możesz
            totalPlaces: seatsCount,
            availablePlaces: freeSeatsCount,
            soldPlaces: soldSeatsCount,
            timestamp: new Date()
        };

        console.log("💾 Inserting data into database...", stadiumData);
        await insertStadiumData(stadiumData);

    } catch (error) {
        console.error("❌ Error during scraping:", error);
        throw error;
    } finally {
        await browser.close();
        console.log("\n🏁 Browser closed");
    }
}

createTable().catch(console.error).then(() => {

    scrapeTickets().catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });

    // Powtarzaj co 10 minut (600 000 ms)
    setInterval(() => {
        scrapeTickets().catch((error) => {
            console.error("Fatal error:", error);
            process.exit(1);
        })
    }, 10 * 60 * 1000);
});

// Run the scraper


//event id
// labelka klubu kotry przedaje bilety motor
// total places albo capacity 
// available places
// sold places
// sektor, narazie hard coded all
// timestamp
// wystaw api (location) => [rows]
