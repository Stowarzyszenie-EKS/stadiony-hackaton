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