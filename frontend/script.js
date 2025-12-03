// --------- KONFIGURACJA KLUBÓW ----------
const CLUBS = [
    {
        id: "cracovia",
        name: "Krakowia",
        colors: ["#d7263d", "#f05f57", "#ffd166"],
        badgeLetter: "K"
    },
    {
        id: "portowcy",
        name: "Pogon",
        colors: ["#0033A0", "#00A9E0", "#FFD700"],
        badgeLetter: "N"
    },
    {
        id: "kolejorz",
        name: "Kolejorz",
        colors: ["#003C71", "#88C1E0", "#A7D129"],
        badgeLetter: "L"
    }
];

// API endpoint
const API_URL = "https://hakaton.sympozjon.org/api";

// ------------------------------------------
// ELEMENTY
// ------------------------------------------

const clubSwitcher = document.getElementById("clubSwitcher");
const clubNameBox = document.getElementById("clubNameBox");
const clubBadge = document.getElementById("clubBadge");
const freeSeatsBox = document.getElementById("freeSeats");
const soldTotalInfo = document.getElementById("soldTotalInfo");

const leftStripes = document.getElementById("leftStripes");
const rightStripes = document.getElementById("rightStripes");

// ------------------------------------------
// GENEROWANIE PRZEŁĄCZNIKÓW
// ------------------------------------------

CLUBS.forEach(club => {
    const btn = document.createElement("button");
    btn.className = "club-btn";
    btn.innerText = club.name[0] + club.name[1];
    btn.onclick = () => setActiveClub(club.id);
    btn.dataset.id = club.id;
    clubSwitcher.appendChild(btn);
});

// ------------------------------------------
// FUNKCJA USTAWIAJĄCA AKTYWNY KLUB
// ------------------------------------------

async function setActiveClub(id) {
    const club = CLUBS.find(c => c.id === id);

    // Podświetlenie przycisku
    document.querySelectorAll(".club-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.id === id);
    });

    // Nazwa
    clubNameBox.innerText = club.name.toUpperCase();

    // Herb – sześciokąt SVG
    clubBadge.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 100 100">
            <polygon points="50,4 90,26 90,74 50,96 10,74 10,26"
                     fill="${club.colors[0]}"
                     stroke="#222" stroke-opacity="0.1"/>
            <text x="50" y="58" text-anchor="middle"
                  font-size="30" font-weight="700" fill="#fff">
                ${club.badgeLetter}
            </text>
        </svg>
    `;

    // Diagonal stripes
    updateStripes(club.colors);

    // Dane z API
    await loadSeats(id);
}

// ------------------------------------------
// UAKTUALNIONE PASY UKOŚNE
// ------------------------------------------

function updateStripes(colors) {
    leftStripes.innerHTML = `
        <div style="flex:1; background:${colors[0]}; opacity:0.7;"></div>
        <div style="flex:1; background:${colors[1]}; opacity:0.7;"></div>
        <div style="flex:1; background:${colors[2]}; opacity:0.7;"></div>
    `;
    rightStripes.innerHTML = leftStripes.innerHTML;
}

// ------------------------------------------
// ŁADOWANIE DANYCH Z API
// ------------------------------------------

async function loadSeats(clubId) {
    try {
        // Tu należy dopasować endpoint do realnego API
        const url = `${API_URL}/${clubId}`;

        const response = await fetch(url);
        const data = await response.json();

        // API zwraca pojedynczy obiekt z najnowszym datapointem
        const total = data.total_places;
        const free = data.available_places;
        const sold = total - free;

        freeSeatsBox.innerText = free;
        soldTotalInfo.innerText = `${sold} / ${total}`;

    } catch (e) {
        console.warn("API niedostępne — używam mocka.");

        const mock = {
            cracovia: { sold: 1200, total: 8000 },
            portowcy: { sold: 2200, total: 10000 },
            kolejorz: { sold: 4200, total: 4200 }
        };

        const data = mock[clubId];

        freeSeatsBox.innerText = data.total - data.sold;
        soldTotalInfo.innerText = `${data.sold} / ${data.total}`;
    }
}

// ------------------------------------------
// START – ustaw pierwszy klub
// ------------------------------------------

setActiveClub("cracovia");
