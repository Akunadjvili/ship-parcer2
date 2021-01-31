//npm install puppeteer puppeteer-core -D
const puppeteer = require("puppeteer");
const dateFormat = require("dateformat");
const filesystem = require("fs");
const parseArgs = require("minimist")(process.argv.slice(2));
const ProgressBar = require("progress");

// Update progress and draw to screen:

const homeURL = "https://www.marinetraffic.com";
// const searchValue = "DRAWSKO";
let searchValue = parseArgs.s ? parseArgs.s.trim() : "";
// searchValue = "DRS";
const pagesCount =
  Number(parseArgs.p) in [(10, 20, 50)] ? Number(parseArgs.p) : 10;

let browser;
let page;
let bar;

const transformDate = (stamp) => {
  const date = new Date(stamp * 1000);
  return dateFormat(date, "dd.mm-yy");
};
const clearUrl = (url) => {
  const cropIndex = url.indexOf("/mmsi");
  const cropUrl = url.slice(0, cropIndex);
  return `${homeURL}${cropUrl}`;
};
const getLinks = () => {
  const links = document.querySelectorAll(".search_index_link");
  return Array.from(links, (a) => a.getAttribute("href"));
};

const ships = [];

const endScrapping = async () => {
  let table = "";

  for (const ship of ships) {
    let name, timestamp, vesselName;

    if (ship.voyageInfo && ship.voyageInfo.departurePort) {
      name = ship.voyageInfo.departurePort.name;
      timestamp = ship.voyageInfo.departurePort.timestamp
        ? ship.voyageInfo.departurePort.timestamp
        : 0;
      vesselName = ship.voyageInfo.vesselName;
    } else {
      name = "платно || нет данных || ошибка";
      timestamp = 0;
      if (ship.vesselInfo) {
        vesselName = ship.vesselInfo.name;
      }
    }
    table += `Vessel: ${vesselName}\tDeparture Port: ${name}\t Date Departure: ${transformDate(
      timestamp
    )}\n`;
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

const getProgressBar = (line, maximum) => {
  return new ProgressBar(line, {
    complete: "=",
    incomplete: " ",
    width: 50,
    total: maximum,
  });
};

let scrape = async () => {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
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

  bar = getProgressBar(
    "  Загрузка списка кораблей [:bar] страница [:current из :total]",
    Number(count)
  );
  let links = [];
  bar.tick(1);
  links = await page.evaluate(getLinks);
  if (count > 1) {
    for (let i = 2; i <= count; i += 1) {
      bar.tick(1);
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

    bar = getProgressBar(
      "  Загрузка информации о кораблях [:bar]  [:current из :total]",
      ships.length
    );

    for (const ship of ships) {
      bar.tick(1);
      const [voyageInfo, vesselInfo, latestPosition] = await Promise.all([
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/voyageInfo/shipid:");
          }, 5000)
          .then((response) => response.json())
          .catch((err) => {}),
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/vesselInfo/shipid:");
          }, 5000)
          .then((response) => response.json())
          .catch((err) => {}),
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/latestPosition/shipid:");
          }, 5000)
          .then((response) => response.json())
          .catch((err) => {}),
        page.goto(ship.url, { waitUntil: "load" }),
      ]);
      [ship.voyageInfo, ship.vesselInfo, ship.latestPosition] = [
        voyageInfo,
        vesselInfo,
        latestPosition,
      ];
    }
    endScrapping();
  }

  return links;
};

scrape()
  .then((value) => {
    console.log("Loaded OK");
    browser.close();
  })
  .catch((err) => console.log("Error"));
