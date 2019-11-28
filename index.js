const cheerio = require("cheerio");

const Twilio = require("twilio");

const axios = require("axios");

require("dotenv").config();

const destinationNumbers = process.env.TO_NUMBERS.split(" ");

const FROM_NUMBER = process.env.FROM_NUMBER;
const FETCH_INTERVAL = 20000; // 20 seconds

const twilio = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_KEY);

const amazonPagesToWatch = process.env.AMAZON_PAGES.split(" ");

const watchPage = async pageUrl => {
  try {
    const { data: falconPage } = await axios.get(pageUrl);
    const $ = cheerio.load(falconPage);

    const priceNode = $("#priceblock_ourprice");

    const dealPriceNode = $("#priceblock_dealprice");

    let rawPrice = null;
    let rawDealPrice = null;
    let parsedDealPrice = null;
    let parsedPrice = null;

    try {
      rawDealPrice = dealPriceNode[0].children[0].data;
      parsedDealPrice = parseInt(rawDealPrice.replace("$", ""), 10);
    } catch (e) {
      console.log("could not find deal price");
    }

    try {
      rawPrice = priceNode[0].children[0].data;
      parsedPrice = parseInt(rawPrice.replace("$", ""), 10);
    } catch (e) {
      console.log("could not find normal price");
    }

    const finalPrice = Math.min(
      typeof parsedPrice == "number" ? parsedPrice : 999999,
      typeof parsedDealPrice == "number" ? parsedDealPrice : 999999
    );
    if (finalPrice < 799) {
      console.warn(`LOW PRICE ${finalPrice}`);
      sendMessageToDestinations(`Milennium Falcon Price $${finalPrice}`);
    }
  } catch (e) {
    console.log("error while fetching page", e);
  }
};

function sendMessageToDestinations(message) {
  destinationNumbers.forEach(number => {
    twilio.messages.create({
      from: FROM_NUMBER,
      to: number,
      body: message
    });
  });
}

amazonPagesToWatch.forEach(pageUrl =>
  setInterval(() => watchPage(pageUrl), FETCH_INTERVAL)
);
