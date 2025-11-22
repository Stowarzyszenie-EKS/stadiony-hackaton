import express from "express";
import { Client } from "pg";

const app = express();
const PORT = 8080;

// Mock data
const stadiumData = {
    totalSeats: 50000,
    occupiedSeats: 32000,
    freeSeats: 18000,
    clubName: "FCSuperClub"
};

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

app.get('/api/ENDPOINT_SUPER_GREAT', (req, res) => {
    res.json({
        totalSeats: stadiumData.totalSeats,
        occupiedSeats: stadiumData.occupiedSeats,
        freeSeats: stadiumData.freeSeats,
        clubName: stadiumData.clubName
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
