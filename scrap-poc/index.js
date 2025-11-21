const puppeteer = require("puppeteer");
const credentials = require("./credentials");
var fs = require('fs');


//const url = 'https://booksale.pl/zludne-nadzieje-p229655';
const debugPath = './debug'
const scrape = async () => {
    const url = process.argv[2];
    const imgName = process.argv[3];
    const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 3080 } });
    const page = await browser.newPage();
    console.log("Scrape started")
    try {
        onInterrupt(browser)
        await page.goto(url);

        await activelyWait(page)

        await click(page, '.do-koszyka')
        await click(page, '#tCart')
        await click(page, '#wysylka_1_32')

        await fillDeliveryFrom(page)
        await click(page, '#rodo')
        await click(page, '#rules')

        await page.screenshot({ path: `${debugPath}/${imgName}_before_submit.png`, fullPage: true });
        // await click(page, "#confirmation > div > input.button_long")
        await closePopup(page, "#popup18", "button.close")
        await closePopup(page, "#cookie_info", "a.close_cookie")
        await page.screenshot({ path: `${debugPath}/${imgName}_after_popup.png`, fullPage: true });
        await click(page, "#ev__shopcart-submit-input")
        await page.screenshot({ path: `${debugPath}/${imgName}_after_submit.png` });
        try {
            await waitForSelector(page, "#pay__radio-field--payer")
        } catch (e) {
            await fallback(page, imgName)
        }
        await page.screenshot({ path: `${debugPath}/${imgName}_on_payment.png` });
        await browser.close();
    } catch (e) {
        console.log("gracefully shutdown")
        await page.screenshot({ path: `${debugPath}/${imgName}_error.png`, fullPage: true });
        await browser.close();
        throw e;
    }
};

async function fallback(page, imgName) {
    await page.screenshot({ path: `${debugPath}/${imgName}_fallback.png`, fullPage: true });
    await page.reload();
    await page.screenshot({ path: `${debugPath}/${imgName}_fallback_relload.png` });
    await waitForSelector(page, "#pay__radio-field--payer")
    await page.screenshot({ path: `${debugPath}/${imgName}_fallback_on_payment.png` });
}

function onInterrupt(browser) {
    process.on('SIGINT', function () {
        console.log("Caught interrupt signal");
        browser.close();
        process.exit();
    });
    console.log("Hook installed")
}

async function fillDeliveryFrom(page,) {

    await fillInput(page, "#imie", credentials.firstName)
    await fillInput(page, "#nazwisko", credentials.lastName)
    await fillInput(page, "#adres", credentials.adres)
    await fillInput(page, "#adres_no", credentials.adresNo)
    await fillInput(page, "#kod_poczt", credentials.postCode)
    await fillInput(page, "#miejscowosc", credentials.city)
    await fillInput(page, "#telefon", credentials.phoneNumber)
    await fillInput(page, "#email", credentials.email)

}


async function click(page, selector) {
    const result = await waitForSelector(page, selector)
    await result.evaluate(b => b.click());
}

async function fillInput(page, inputName, value) {
    await waitForSelector(page, inputName)
    await page.type(inputName, value);
    console.log(value)
}

async function closePopup(page, selector, closeSelector) {
    const popup = await page.$(selector)
    if (popup == null) {
        return;
    }
    console.log(selector + " appeared")
    const close = await popup.$(closeSelector)
    await close.evaluate(b => b.click());
}

async function waitForSelector(page, selector) {
    const result = await page.waitForSelector(selector, {
        timeout: 5000,
        visible: true
    });
    console.log(selector + " appeared")
    return result
}

async function activelyWait(page) {
    while (true) {
        try {
            await page.waitForSelector('.do-koszyka', {
                timeout: 1000,
            })
            console.log("Page ready!")
            return
        } catch (e) {
            console.log("Page not ready!")
            await page.reload()
        }
    }
}

if (!fs.existsSync(debugPath)) {
    fs.mkdirSync(debugPath);
}

scrape().catch(e => console.log(e));