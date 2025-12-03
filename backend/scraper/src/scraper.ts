import puppeteer from "puppeteer";
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
    user: 'app',
    host: 'db',  // bo port wystawiony na Maca
    database: 'app',
    password: 'app',
    port: 5432,
});

async function createTable() {
    const client = await pool.connect();
    try {
        await client.query(`
  DROP TABLE IF EXISTS stadium_seats;

`)
        await client.query(`
  CREATE TABLE IF NOT EXISTS  stadium_seats (
    id SERIAL PRIMARY KEY,
    event_id TEXT,
    club_label TEXT,
    total_places INT,
    available_places INT,
    sold_places INT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, created_at)
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
    eventId: string;
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
                 event_id, club_label, total_places, available_places, sold_places, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING`,
            [
                data.eventId,
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

interface ClubsConfig {
    ekstraklasa: {
        clubs: {
            [key: string]: string;
        }
    }
}

function loadClubsConfig(): ClubsConfig {
    // W kontenerze Docker plik clubs.json jest w /app/clubs.json
    const clubsPath = path.join(__dirname, '../clubs.json');
    const clubsData = fs.readFileSync(clubsPath, 'utf-8');
    return JSON.parse(clubsData);
}

interface Stadion {
    sectors?: Sector[];
}

interface Sector {
    seatsReservedFor: number;
}


interface Seats {
    seats?: any[]
}


async function scrapeTickets(clubLabel: string, baseUrl: string) {
    console.log(`🚀 Starting ${clubLabel} tickets scraper...`);

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
        console.log(`📄 Navigating to ${baseUrl}...`);
        await page.goto(baseUrl, {
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
        const stadiumUrl = `${baseUrl}${firstEventLink}`;
        console.log(`\n📄 Navigating to stadium page: ${stadiumUrl}...`);

        // Set referer to the main page
        await page.setExtraHTTPHeaders({
            ...await page.evaluate(() => ({})), // Keep existing headers
            'Referer': baseUrl
        });



        let seats: Seats | undefined = undefined as Seats | undefined;

        // Przechwytywanie response
        page.on('response', async (response) => {
            console.log("🌐 Response:", response.url(), response.status());
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
            eventId: eventId,
            clubLabel: clubLabel,
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

async function scrapeAllClubs() {
    const config = loadClubsConfig();
    const clubs = config.ekstraklasa.clubs;

    console.log(`📋 Found ${Object.keys(clubs).length} clubs to scrape`);

    for (const [clubLabel, baseUrl] of Object.entries(clubs)) {
        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🏟️  Processing club: ${clubLabel}`);
            console.log(`🔗 URL: ${baseUrl}`);
            console.log(`${'='.repeat(60)}\n`);

            await scrapeTickets(clubLabel, baseUrl);

            console.log(`✅ Successfully scraped ${clubLabel}`);

            // Opcjonalne: krótkie opóźnienie między klubami
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ Error scraping ${clubLabel}:`, error);
            // Kontynuuj z następnym klubem mimo błędu
            continue;
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏁 Finished scraping all clubs`);
    console.log(`${'='.repeat(60)}`);
}

createTable()
    .then(() => scrapeAllClubs())
    .then(() => {
        console.log("✅ All scraping completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
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
