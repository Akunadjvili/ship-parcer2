//npm install puppeteer puppeteer-core -D
const path = require("path");
const puppeteer = require("puppeteer");
const dateFormat = require("dateformat");
const filesystem = require("fs");
const buildOptions = require("minimist-options");
const minimist = require("minimist");
const ProgressBar = require("progress");

const dataJSON = path.resolve(path.dirname(__filename), "result.json");
const dataTable = path.resolve(path.dirname(__filename), "result.csv");
const workFiles = [dataJSON, dataTable];
for (const file of workFiles) {
  if (filesystem.existsSync(file)) {
    try {
      filesystem.unlinkSync(file);
    } catch (err) {
      console.error(err);
      return;
    }
  }
}

const options = buildOptions({
  search: {
    type: "string",
    alias: "s",
    default: "",
  },
  dateformat: {
    type: "string",
    alias: "d",
    default: "dd.mm.yyyy",
  },

  format: {
    type: "boolean",
    alias: "f",
    default: false,
  },

  page: {
    type: "number",
    alias: "p",
    default: 50,
  },

  timeout: {
    type: "number",
    alias: "tt",
    default: 30000,
  },

  limit: {
    type: "number",
    alias: "l",
    default: 0,
  },
  type: {
    type: "number",
    alias: "t",
    default: 0,
  },
  hidden: {
    type: "boolean",
    alias: "b",
    default: true,
  },
  published: "boolean",
  arguments: "string",
});

const parseArgs = minimist(process.argv.slice(2), options);

const outputFormat = parseArgs.format;
const limit = parseArgs.limit;
const timeout = parseArgs.timeout;
const dateformat = parseArgs.dateformat;

const browserVisible = parseArgs.hidden;

const type = [0, 1].includes(parseArgs.type) ? parseArgs.type : 0;
const searchType = type ? `/search_type:${type}` : "";


const pagesCount = [10, 20, 50].includes(parseArgs.page) ? parseArgs.page : 50;
const searchValue = parseArgs.search.trim();

const homeURL = "https://www.marinetraffic.com";
const cookieModalAcceptSelector =
  "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-flk0bs";

// const searchValue = "DRAWSKO";

let browser;
let page;
let bar;

const transformDate = (stamp, format = "dd.mm.yyyy") => {
  const date = new Date(stamp * 1000);
  return dateFormat(date, format);
};

const clearUrl = (url, base) => {
  const cropIndex = url.indexOf("/mmsi");
  const cropUrl = url.slice(0, cropIndex);
  return `${base}${cropUrl}`;
};

const getLinks = () => {
  const links = document.querySelectorAll(".search_index_link");
  return Array.from(links, (a) => a.getAttribute("href"));
};

const saveToFile = (name, data) => {
  filesystem.writeFile(name, data, function (err) {
    if (err) {
      console.log(err);
    }
  });
};

const ships = [];

const saveData = async () => {
  let table = "";

  for (const ship of ships) {
    let departurePort = "-==missing data==-", timestamp = 0, vesselName = "-==missing data==-";

    if (ship.voyageInfo && ship.voyageInfo.departurePort) {
      departurePort = ship.voyageInfo.departurePort.name;
      timestamp = ship.voyageInfo.departurePort.timestamp
        ? ship.voyageInfo.departurePort.timestamp
        : 0;
      vesselName = ship.voyageInfo.vesselName;
    } else {
      departurePort = "-==missing data==-";
      timestamp = 0;
      if (ship.vesselInfo) {
        vesselName = ship.vesselInfo.name;
      }
    }
    table += `${vesselName};${departurePort};${transformDate(timestamp, dateformat)};\n`;
  }
  saveToFile("result.csv", table);
  saveToFile("result.json", JSON.stringify(ships));
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
  browser = await puppeteer.launch({ headless: browserVisible });
  page = await browser.newPage();
  page.setDefaultTimeout(timeout)
  // page.setDefaultNavigationTimeout(timeout)
  await page.goto(
    `${homeURL}/en/ais/index/search/all/per_page:${pagesCount}${searchType}/page:1/keyword:${searchValue}`,
    { waitUntil: "load" }
  );


  await page.waitForSelector(cookieModalAcceptSelector);
  await page.click(cookieModalAcceptSelector);

  let count = await page.evaluate(() => {
    const span = document.querySelector("#indexForm + span");
    return span ? Number(span.textContent.match(/\d+/)[0]) : 1;
  });

  bar = getProgressBar(
    "  Download: List of ships [:bar] page [:current from :total]", Number(count)
  );
  let links = [];
  console.log(`Found ${count} pages. Processing...`);
  bar.tick(1);
  links = await page.evaluate(getLinks);
  if (count > 1) {
    count = limit ? Math.min(count, limit) : count
    for (let i = 2; i <= count; i += 1) {
      bar.tick(1);
      await page.goto(
        `${homeURL}/en/ais/index/search/all/per_page:${pagesCount}${searchType}/page:${i}/keyword:${searchValue}`,
        { waitUntil: "load" }
      );
      links = [...links, ...(await page.evaluate(getLinks))];
    }
  }
  links = links.map((elm) => clearUrl(elm, homeURL));
  console.log(`Found ${links.length} ships. Downloading info...`);
  if (links.length) {
    for (const ship of links) {
      const id = ship.match(/\d+/)[0];
      const url = ship;
      ships.push({ url, id });
    }

    bar = getProgressBar(
      "  Download: Ships [:bar] ship [:current from :total]", ships.length
    );

    for (const ship of ships) {
      bar.tick(1);
      const [voyageInfo, vesselInfo, latestPosition] = await Promise.all([
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/voyageInfo/shipid:");
          })
          .then((response) => response.json())
          .catch((err) => { }),
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/vesselInfo/shipid:");
          })
          .then((response) => response.json())
          .catch((err) => { }),
        page
          .waitForResponse((res) => {
            return res.url().includes("/vesselDetails/latestPosition/shipid:");
          })
          .then((response) => response.json())
          .catch((err) => { }),
        await page.goto(ship.url, { waitUntil: "load" }),
      ]);
      [ship.voyageInfo, ship.vesselInfo, ship.latestPosition] = [
        voyageInfo,
        vesselInfo,
        latestPosition,
      ];
    }
    saveData();
  }

  return links;
};

scrape()
  .then((value) => {
    console.log("Loaded OK");
    browser.close();
  })
  .catch((err) => console.log("Error"));
