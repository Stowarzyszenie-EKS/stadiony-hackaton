import axios from "axios";
import express from "express";
import { Client } from "pg";


async function main() {
    const res = await axios.get("https://api.github.com");
    console.log("Dane:", res.data);
}

main().catch(console.error);

const app = express();

app.get("/seats/:clubName/:eventId", async (req, res) => {
    const { clubName, eventId } = req.params;
    const client = new Client({
        host: "app-db",
        user: "app",
        password: "app",
        database: "app",
    });
    try {
        await client.connect();
        const result = await client.query(
            `SELECT timestamp, capacity, available_places
             FROM events
             WHERE club_name = $1 AND event_id = $2
             ORDER BY timestamp DESC`,
            [clubName, eventId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Event not found" });
        } else {
            res.status(200).json(result.rows);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: "Database error", details: errorMessage });
    } finally {
        await client.end();
    }
});

app.listen(8080, () => {
    console.log("Server running on port 8080");
});