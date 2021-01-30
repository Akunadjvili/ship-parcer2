//npm install puppeteer puppeteer-core -D
const puppeteer = require("puppeteer");
const dateFormat = require("dateformat");
const filesystem = require("fs");
const parseArgs = require("minimist")(process.argv.slice(2));
// const ProgressBar = require("progress");

// const bar = new ProgressBar(":total", { total: 10 });
// bar.tick();
// bar.tick();
// bar.tick();
// bar.tick();
// Update progress and draw to screen:

const homeURL = "https://www.marinetraffic.com";
// const searchValue = "DRAWSKO";
let searchValue = parseArgs.s ? parseArgs.s.trim() : "";
// searchValue = "";
const pagesCount =
  Number(parseArgs.p) in [(10, 20, 50)] ? Number(parseArgs.p) : 10;

let browser;
let page;

const transformDate = (stamp) => {
  const date = new Date(stamp * 1000);
  return dateFormat(date, "dd.mm-yy");
};

const ships = [];

const endScrapping = async () => {
  let table = "";

  for (const ship of ships) {
    console.log(ship);
    let name, timestamp;
    if (ship.data.departurePort) {
      name = ship.data.departurePort.name;
      timestamp = ship.data.departurePort.timestamp;
    } else {
      name = "locked-buy";
      timestamp = 0;
    }
    table += `${name} ${transformDate(timestamp)}\n`;
  }
  filesystem.writeFile("table.txt", table, function (err) {
    if (err) {
      console.log(err);
    }
  });
  filesystem.writeFile("result.json", JSON.stringify(ships), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

let scrape = async () => {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  // page.on("response", getSearchJSON);
  await page.goto(
    `${homeURL}/en/ais/index/search/all/per_page:${pagesCount}/search_type:1/page:1/keyword:${searchValue}`,
    { waitUntil: "load" }
  );

  const cookieModalAcceptSelector =
    "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-flk0bs";
  await page.waitForSelector(cookieModalAcceptSelector);
  await page.click(cookieModalAcceptSelector);

  const count = await page.evaluate(() => {
    const span = document.querySelector("#indexForm + span");
    return span ? span.textContent.match(/\d+/)[0] : 1;
  });
  const clearUrl = (url) => {
    const cropIndex = url.indexOf("/mmsi");
    const cropUrl = url.slice(0, cropIndex);
    return `${homeURL}${cropUrl}`;
  };
  const getLinks = () => {
    const links = document.querySelectorAll(".search_index_link");
    return Array.from(links, (a) => a.getAttribute("href"));
  };

  let links = [];
  links = await page.evaluate(getLinks);
  if (count > 1) {
    for (let i = 2; i <= 2; i += 1) {
      await page.goto(
        `${homeURL}/en/ais/index/search/all/per_page:${pagesCount}/search_type:1/page:${i}/keyword:${searchValue}`,
        { waitUntil: "load" }
      );
      links = [...links, ...(await page.evaluate(getLinks))];
    }
  }
  links = links.map((elm) => clearUrl(elm));
  if (links.length) {
    for (const ship of links) {
      const id = ship.match(/\d+/)[0];
      const url = ship;
      const search = `${homeURL}/vesselDetails/voyageInfo/shipid:${id}`;
      ships.push({ url, search, id });
    }
    // page.on("response", getVesselJSONList);
    for (const ship of ships) {
      await page.goto(ship.url, { waitUntil: "load" });
      const finalResponse = await page.waitForResponse(
        (response) => response.url() === ship.search
      );
      ship.data = await finalResponse.json();
    }
    endScrapping();
  }
  
  return links;
};

scrape().then((value) => {
  console.log(value);
  await browser.close();
});
