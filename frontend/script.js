async function fetchAttendanceData(club) {
    try {
        const response = await fetch(`/api/attendance/${club}`);
        if (!response.ok) {
            throw new Error(`Błąd: ${response.statusText}`);
        }
        const data = await response.json();

        // Wyświetl dane na stronie
        renderAttendanceData(club, data);
    } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
    }
}

function renderAttendanceData(club, data) {
    const container = document.getElementById('dataContainer');
    container.innerHTML = `
        <h2>${club}</h2>
        <p>Wszystkie miejsca: ${data.totalSeats}</p>
        <p>Sprzedane miejsca: ${data.soldSeats}</p>
    `;
}

// Przykład: Pobierz dane dla wybranego klubu
const selectedClub = 'Przykładowy Klub'; // Podmień na właściwą nazwę klubu
fetchAttendanceData(selectedClub);

document.addEventListener("DOMContentLoaded", () => {
    fetch("defaults.json")
        .then(response => response.json())
        .then(data => {
            const counter = document.getElementById("counter");
            counter.textContent = `${data.attendance.current} / ${data.attendance.max}`;

            const stripes = document.querySelectorAll(".stripe");
            stripes[0].style.backgroundColor = data.colors[1]; // red
            stripes[1].style.backgroundColor = data.colors[0]; // white
            stripes[2].style.backgroundColor = data.colors[2]; // black
        })
        .catch(error => console.error("Error loading defaults.json:", error));
});