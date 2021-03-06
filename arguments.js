const buildOptions = require("minimist-options");

module.exports = buildOptions({
    search: {
        type: "string",
        alias: "s",
        default: "",
    },
    output: {
        type: "string",
        alias: "ot",
        default: "",
    },
    dateformat: {
        type: "string",
        alias: "d",
        default: "dd.mm.yyyy",
    },

    list: {
        type: "boolean",
        alias: "l",
        default: false,
    },
    strict: {
        type: "boolean",
        alias: "sm",
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