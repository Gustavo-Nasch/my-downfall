const { chromium } = require('playwright');
const { createObjectCsvWriter } = require('csv-writer');

const csvWriter = createObjectCsvWriter({
    path: 'c:/GmScrape/file.csv',
    header: [
        { id: 'nome', title: 'NAME' },
        { id: 'nota', title: 'NOTA' },
        { id: 'numero', title: 'NUMERO' }
    ]
});

var query = [
    "https://www.google.com/maps/search/alongamento+de+unhas+em+arauc%C3%A1ria/@-25.5852124,-49.4131131,15z/data=!3m1!4b1?entry=ttu",
    "https://www.google.com/maps/search/cl%C3%ADnicas+de+est%C3%A9tica+em+pouso+alegre/@-22.4605954,-46.6981792,9z/data=!3m1!4b1?entry=ttu",
    "https://www.google.com/maps/search/cl%C3%ADnicas+de+est%C3%A9tica+em+pouso+alegre/@-22.4605954,-46.6981792,9z/data=!3m1!4b1?entry=ttu",
    "https://www.google.com/maps/search/alongamento+de+unhas+em+pouso+alegre/@-22.3409747,-46.1333922,11z/data=!3m1!4b1?entry=ttu",
];

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    var allEmpresas = [];

    for (let i = 0; i < query.length; i++) {
        await page.goto(query[i]);
        console.log("going to query " + query[i]);

        const scrollable = await page.$('xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]');
        let endOfList = false;

        while (!endOfList) {
            await scrollable.evaluate(node => node.scrollBy(0, 50000));
            await page.waitForTimeout(5000);
            const buttons = await page.$$('.hfpxzc');
            const randomIndex = Math.floor(Math.random() * buttons.length);
            const button = buttons[randomIndex];
            await button.click();
            endOfList = await page.evaluate(() => document.body.innerText.includes("Você chegou ao final da lista."));
        }

        console.log("reached end of scrolling");

        const urls = await page.$$eval('.hfpxzc', elements => elements.map(element => element.href));
        console.log("all urls extracted");

        for (let j = 0; j < urls.length; j++) {
            await page.goto(urls[j]);
            let empresa = {};

            empresa.nome = await page.locator('h1.DUwDvf.lfPIob').textContent();
            empresa.nota = await page.locator('.F7nice').textContent();

            const tamanhoBloco = await page.$$eval('.rogA2c', elements => elements.map(element => element.textContent));
            let novoNumero = '';

            for (let k = 0; k < tamanhoBloco.length; k++) {
                const bloco = tamanhoBloco[k];
                if (bloco.includes('(') && !bloco.includes('+') && !bloco.includes('.') && !bloco.includes(',')) {
                    const numero1 = bloco;
                    novoNumero = "+55" + numero1.replace("(", '').replace(")", '').replace("-", '').replace(" ", '');
                    break;
                }
            }

            empresa.numero = novoNumero;
            allEmpresas.push(empresa);
        }

        console.log("all businesses extracted for query " + query[i]);
    }

    await browser.close();
    console.log("all pages extracted, writing csv file..");

    // Write to CSV once after all queries are processed
    csvWriter.writeRecords(allEmpresas)
        .then(() => {
            console.log('file written successfully');
        });
})();
//"https://www.google.com/maps/search/cl%C3%ADnicas+de+est%C3%A9tica+em+mogi+gua%C3%A7u/@-22.3580824,-46.9753298,13z/data=!3m1!4b1?entry=ttu",
//