const dateFormat = require("dateformat");
const ProgressBar = require("progress");

const transformDate = (stamp, format = "dd.mm.yyyy") => {
    const date = new Date(stamp * 1000);
    return dateFormat(date, format);
};

const clearUrl = (url, base) => {
    const cropIndex = url.indexOf("/mmsi");
    const cropUrl = url.slice(0, cropIndex);
    return `${base}${cropUrl}`;
};

const filterUrls = (hrefs, options, search) => {
    let list = [...hrefs].filter(({ href }) => { return href.includes("/ais/") })

    if (options.strict) {
        list = list.filter(
            ({ title }) =>
                title.toLowerCase().trim() === search.toLowerCase().trim());
    }
    return list.map(({ href }) => href)
}

const getLinks = () => {
    const links = document.querySelectorAll(".filters_results_table .search_index_link");
    return Array.from(links, (a) => (
        {
            title: a.textContent,
            href: a.getAttribute("href")
        }))
};

const getProgressBar = (line, maximum) => {
    return new ProgressBar(line, {
        complete: "=",
        incomplete: " ",
        width: 50,
        total: maximum,
    });
};

module.exports = { transformDate, clearUrl, filterUrls, getLinks, getProgressBar }