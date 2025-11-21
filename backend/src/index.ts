import axios from "axios";

async function main() {
    const res = await axios.get("https://api.github.com");
    console.log("Dane:", res.data);
}

main().catch(console.error);