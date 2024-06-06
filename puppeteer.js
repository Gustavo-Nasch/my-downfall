const puppeteer = require('puppeteer');

const contacts = [
  '5594019320104', // false
  '5513974020298', // real 
  '5513991655897',  // real 
  '5513991093086',  // real
  '558881953960',    //real
  '5512398343200'    //false
];

const message = 'testando, pode ignorar essa mensagem';
const messageSlug = encodeURIComponent(message);
const invalidNumberMessage = 'O número de telefone compartilhado por url é inválido.';
const maxRetries = 3;
const retryDelay = 5000;
let invalidNumbersCount = 0;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Launch browser
  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com');

  // login
  console.log('escaneie o QR code pfv');
  await wait(60000);
  console.log("Web WhatsApp loaded successfully");

  for (let i = 0; i < contacts.length; i++) { // enviar mensagens pra todos números
    let success = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) { //diversas tentativas caso loading demore
      try {
        const url = `https://web.whatsapp.com/send/?phone=${contacts[i]}&text=${messageSlug}&type=phone_number&app_absent=0`;
        console.log(`Attempting to send message to ${contacts[i]} (Attempt ${attempt})`);
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // espera número inválido, ou que a mensagem desejada seja enviada
        const result = await page.waitForFunction(
          (invalidNumberMessage, message) => {
            return document.body.innerText.includes(invalidNumberMessage) || 
                   document.querySelector(`span[title="${message}"]`);
          },
          { timeout: 15000 },
          invalidNumberMessage,
          message
        );

        const invalidNumber = await page.evaluate(invalidNumberMessage => {
          return document.body.innerText.includes(invalidNumberMessage);
        }, invalidNumberMessage);

        if (invalidNumber) {
          console.log(`Number is invalid: ${contacts[i]}`);
          invalidNumbersCount++;
          break; // número inválido = sai do loop
        }

        console.log("conversa iniciada");

        await page.keyboard.press('Enter');
        console.log("enter pressionado");

        await wait(5000);

        const messageSent = await page.evaluate(message => {
          return document.body.innerText.includes(message);
        }, message);

        if (messageSent) {
          success = true;
          console.log(`mensagem enviada ao número: ${contacts[i]}`);
          break;
        } else {
          console.log(`mensagem não encontrada para o número: ${contacts[i]}, tentando novamente...`);
        }

      } catch (error) {
        console.log(`Attempt ${attempt} failed for contact ${contacts[i]}: ${error.message}`);
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await wait(retryDelay);
        }
      }
    }

    if (!success) {
      invalidNumbersCount++;
    }

    await wait(5000); // Wait before sending next message
  }

  console.log(`total de números inválidos: ${invalidNumbersCount}`);

  await browser.close();
})();
