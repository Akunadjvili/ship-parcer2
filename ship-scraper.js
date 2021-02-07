// import ad from "./subroutines.js"
const { filterUrls, clearUrl, getLinks, transformDate, getProgressBar } = require("./subroutines");

const parseOptions = require("./arguments");
const FileManager = require("./storage");

const path = require("path");
const puppeteer = require("puppeteer");


const minimist = require("minimist");

const sanitize = require("sanitize-filename");
const filesystem = require("fs");

let browser;
let page;
let bar;
// const ships = [];

const parseArgs = minimist(process.argv.slice(2), parseOptions);
const type = [0, 1].includes(parseArgs.type) ? parseArgs.type : 0;
const output = parseArgs.output.trim();



const options = {
  homeURL: "https://www.marinetraffic.com",
  strict: parseArgs.strict,
  list: parseArgs.list,
  limit: parseArgs.limit,
  timeout: parseArgs.timeout,
  dateFormat: parseArgs.dateformat,
  isBrowser: parseArgs.hidden,
  output: output === "" ? path.resolve(path.dirname(__filename), "output") : output,
  resultsPerPage: [10, 20, 50].includes(parseArgs.page) ? parseArgs.page : 50,
  type: type ? `/search_type:${type}` : "",

}

if (options.list) {
  const list = parseArgs.search.trim();
  options["originalSearchLine"] = filesystem.readFileSync(list).toString().replace(/[\r]+/gm, "").trim().split("\n");
  console.log(options["originalSearchLine"]);
  options["encodeSearchLine"] = options["originalSearchLine"].map(encodeURI);
  options["file"] = list.slice(0, list.indexOf("."));
} else {
  options["originalSearchLine"] = parseArgs.search.trim();
  options["encodeSearchLine"] = encodeURI(parseArgs.search.trim());
  options["file"] = sanitize(parseArgs.search.trim());
}

const fm = new FileManager(options).delete();

const cookieModalAcceptSelector =
  "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-flk0bs";


const generate = async (ships, options) => {
  //  let table = "vesselName;departurePort;departurePort.timestamp\n";
  let table = "";

  for (const ship of ships) {
    let departurePort = `-==missing data==-()`, timestamp = 0, vesselName = `-==missing data==- (id:${ship.id} / mmsi:${ship.mmsi})`;

    if (ship.voyageInfo && ship.voyageInfo.departurePort) {
      departurePort = ship.voyageInfo.departurePort.name;
      timestamp = ship.voyageInfo.departurePort.timestamp
        ? ship.voyageInfo.departurePort.timestamp
        : 0;
      vesselName = `${ship.voyageInfo.vesselName} (id:${ship.id} / mmsi:${ship.mmsi}) `;
    } else {
      departurePort = "-==missing data==-";
      timestamp = 0;
      if (ship.vesselInfo) {
        vesselName = `${ship.vesselInfo.name} (id:${ship.id} / mmsi:${ship.mmsi})`;
      }
    }
    if (timestamp) {
      table += `${vesselName};${departurePort};${transformDate(timestamp, options.dateFormat)}\n`;
    } else {
      table += `${vesselName};${departurePort};"-==missing data==-"\n`;
    }
  }
  return { csv: table, json: JSON.stringify(ships) }
};



function getAllJSONData(url) {
  return Promise.all([
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
    page.goto(url, { waitUntil: "load" })
      .catch((err) => { console.log(`#Try next time ${err}`); })

  ]);
}

getItemData = async (search, options) => {
  let links = [];
  const ships = [];

  console.log(`Searching for ${decodeURI(search)}...`);
  await page.goto(
    `${options.homeURL}/en/ais/index/search/all/per_page:${options.resultsPerPage}${options.type}/page:1/keyword:${search}`,
    { waitUntil: "load" }
  );

  let count = await page.evaluate(() => {
    const span = document.querySelector("#indexForm + span");
    return span ? Number(span.textContent.match(/\d+/)[0]) : 1;
  });
  count = options.limit ? Math.min(count, options.limit) : count

  bar = getProgressBar(
    "  Download: List of ships [:bar] page [:current from :total]", count);


  console.log(`\nFound ${count} pages. Processing...`);
  bar.tick(1);
  links = filterUrls(await page.evaluate(getLinks), options, decodeURI(search));
  if (count > 1) {
    for (let i = 2; i <= count; i += 1) {
      bar.tick(1);
      await page.goto(
        `${options.homeURL}/en/ais/index/search/all/per_page:${options.resultsPerPage}${options.type}/page:${i}/keyword:${search}`,
        { waitUntil: "load" }
      );
      links = [...links, ...(filterUrls(await page.evaluate(getLinks), options, decodeURI(search)))];
    }
  }

  console.log(`Found ${links.length} ships. Downloading info...`);

  if (links.length) {
    for (const link of links) {
      const url = clearUrl(link, options.homeURL)
      const [id, mmsi] = link.match(/(\d+\.?\d*)/g)
      ships.push({ url, id, mmsi });
    }
    bar = getProgressBar(
      "  Download: Ships [:bar] ship [:current from :total]", ships.length
    );
    for (const ship of ships) {
      bar.tick(1);
      [ship["voyageInfo"], ship["vesselInfo"], ship["latestPosition"]] = await getAllJSONData(ship.url);
    }
    return generate(ships, options)
  }
}


let scrape = async () => {

  browser = await puppeteer.launch({ headless: options.isBrowser });
  page = await browser.newPage();
  page.setDefaultTimeout(options.timeout)
  page.setDefaultNavigationTimeout(0)
  await page.goto("https://www.marinetraffic.com/en/p/company");
  await page.waitForSelector(cookieModalAcceptSelector);
  await page.click(cookieModalAcceptSelector);

  if (options.list) {
    for (const search of options.encodeSearchLine) {
      const data = await getItemData(search, options);
      fm.appendToFile("list", data.csv)
    }
  } else {
    const data = await getItemData(options.encodeSearchLine, options);
    fm.saveToFile('csv', data.csv);
    fm.saveToFile('json', data.json);
  }
  return [];
};

scrape()
  .then((value) => {
    console.log("Loading completed.");
    browser.close();
  })
  .catch((err) => console.log("Error loading ..."));
