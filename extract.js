const {chromium} = require('playwright');
const { createObjectCsvWriter } = require('csv-writer');
const csvWriter = createObjectCsvWriter({
    path: 'c:/GmScrape/file.csv',
    header: [
        {id: 'nome', title: 'NAME'},
        {id: 'nota', title: 'NOTA'},
        {id: 'numero', title: 'NUMERO'}
    ]
});
var query = "https://www.google.com/maps/search/cl%C3%ADnicas+de+est%C3%A9tica+em+toledo/@-23.7052331,-52.7132561,7z/data=!3m1!4b1?entry=ttu";
(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(query);
    const scrollable = await page.$('xpath=/html/body/div[2]/div[3]/div[8]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]');

    // Var to detect end of list
    let endOfList = false;

    while (!endOfList) {
        // Scroll down
        await scrollable.evaluate(node => node.scrollBy(0, 50000));
    
        // Wait for a short duration
        await page.waitForTimeout(5000);
    
        // Click buttons to prevent locking load
        const buttons = await page.$$('.hfpxzc');
            const randomIndex = Math.floor(Math.random() * buttons.length);
            const button = buttons[randomIndex];
                await button.click();

        // Check if it's the end of the list
        endOfList = await page.evaluate(() => document.body.innerText.includes("Você chegou ao final da lista."));
    }

    // Extract urls to an array
    const urls = await page.$$eval('.hfpxzc', elements => elements.map(element => element.href));
var listaEmpresas = [];
var numero = ' ';
for (let i = 0; i < urls.length; i++) { //extract info
    await page.goto(urls[i]);
    let empresa = {};
    empresa.nome = await page.locator('h1.DUwDvf.lfPIob').textContent();
    empresa.nota = await page.locator('.F7nice').textContent();
    const tamanhoBloco = await page.$$eval('.rogA2c', elements => elements.map(element => element.textContent));
    for (let i = 0; i<tamanhoBloco.length; i++) {
        const bloco = tamanhoBloco[i];
        if (bloco.includes('(') && !bloco.includes('+') && !bloco.includes('.') && !bloco.includes(',')) {
           var numero = bloco;
           break;
        }
   }
    empresa.numero = numero;
    listaEmpresas.push(empresa);
}
console.log(listaEmpresas);
csvWriter.writeRecords(listaEmpresas)       // returns a promise
    .then(() => {
        console.log('file written succesfully');
    });
await browser.close();
})();
