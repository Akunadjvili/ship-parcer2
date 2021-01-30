//npm install puppeteer puppeteer-core -D
const puppeteer = require("puppeteer");
const dateFormat = require("dateformat");
const filesystem = require("fs");

// const url = "https://www.marinetraffic.com/";
const homeURL = "https://www.marinetraffic.com";
("https://www.marinetraffic.com/en/p/company");
//https://www.marinetraffic.com/en/data/?asset_type=vessels&columns=flag,shipname,photo,recognized_next_port,reported_eta,reported_destination,current_port,imo,ship_type,show_on_live_map,time_of_latest_position,lat_of_latest_position,lon_of_latest_position,notes
let browser;
let page;

//www.marinetraffic.com/en/ais/index/search/all/per_page:50/search_type:1

//www.marinetraffic.com/en/ais/index/search/all/keyword:hhh/per_page:50/search_type:1/page:15

https: https: const transformDate = (stamp) => {
  const date = new Date(stamp * 1000);
  return dateFormat(date, "dd.mm-yy");
};

const ships = [];

const endScrapping = async () => {
  // let table = "";
  // for (const {
  //   data: {
  //     departurePort: { name, timestamp },
  //   },
  // } of ships) {
  //   table += `${name} ${transformDate(timestamp)}\n`;
  // }
  // filesystem.writeFile("table.txt", table, function (err) {
  //   if (err) {
  //     console.log(err);
  //   }
  // });
  filesystem.writeFile("result.json", JSON.stringify(ships), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

const getSearchJSON = async (response) => {
  if (
    response.url().includes("/global_search/search?term=") &&
    response.request().method() === "GET"
  ) {
    let responseJson = await response.json();
    page.off("response", getSearchJSON);
    page.on("response", getVesselJSONList);
    if (responseJson.results.length) {
      for (const ship of responseJson.results) {
        const id = ship.id;
        const url = `${homeURL}${ship.url}`;
        const search = `${homeURL}/vesselDetails/voyageInfo/shipid:${id}`;
        ships.push({ url, search, id, visited: false });
        await page.goto(url, { waitUntil: "load" });
      }
    }
  }
};

const getVesselJSONList = async (response) => {
  if (
    response.url().includes("/vesselDetails/voyageInfo/shipid") &&
    response.request().method() === "GET"
  ) {
    for (const ship of ships) {
      if (ship.search === response.url()) {
        try {
          ship.data = await response.json();
          ship.visited = true;
        } catch (error) {
          ship.data = {
            data: { departurePort: { name: "error", timestamp: 0 } },
          };
          ship.visited = true;
        }
      }
    }
    const status = ships.every((visited) => {
      return visited;
    });
    if (status) {
      page.off("response", getVesselJSONList);
      await browser.close();
      endScrapping();
    }
  }
};

let scrape = async () => {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  page.on("response", getSearchJSON);
  await page.goto(`${homeURL}/en/p/company`, { waitUntil: "load" }); // { waitUntil: "networkidle0" }
  await page.click(
    "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-flk0bs"
  );
  //#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.css-flk0bs
  await page.click("header");
  await page.focus("#searchMT");
  await page.keyboard.type("HHH"); //DRAWSKO
  return {};
};

scrape().then((value) => {
  console.log(value);
});
