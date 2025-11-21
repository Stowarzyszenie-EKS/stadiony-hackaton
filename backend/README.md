# HOW TO RUN
```npm run scrape```

output LLM:

Jasne — poniżej **gotowy do skopiowania README.md** w całości, bez żadnych dopowiedzeń.

---

```md
# stadiony-hackaton-backend

Backend przygotowany na potrzeby hackathonu. Projekt oparty o **Node.js**, **TypeScript** oraz **ts-node**.

## 📦 Technologie

- Node.js (CommonJS)
- TypeScript
- ts-node
- axios

## 📁 Struktura projektu

```plaintext

.
├── src/
│   └── index.ts
├── dist/
├── package.json
├── tsconfig.json
└── README.md

````

## 🚀 Uruchamianie projektu

### Instalacja zależności

```bash
npm install
````

### Tryb deweloperski

```bash
npm run dev
```

## 🏗️ Budowanie projektu

```bash
npm run build
```

## ▶️ Uruchamianie skompilowanej wersji

```bash
npm start
```

## ⚙️ Konfiguracja TypeScript

Projekt używa CommonJS:

* `"type": "commonjs"` w `package.json`
* wynikowa kompilacja trafia do katalogu `dist/`

## 📡 Zależności

### axios

Przykład użycia:

```ts
import axios from "axios";

async function example() {
  const { data } = await axios.get("https://example.com");
  console.log(data);
}
```

## 📄 Licencja

ISC

```

---
```
