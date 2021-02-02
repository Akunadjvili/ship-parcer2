const sanitize = require("sanitize-filename");
const path = require("path");

module.exports = (name) => {
    const exts = [".json", ".csv"];
    const encodeName = sanitize(name);

    const files = {
        JSON: path.resolve(path.dirname(__filename), `${encodeName}.json`),
        CSV: path.resolve(path.dirname(__filename), `${encodeName}.csv`)
    }
    const saveFile = (name, data) => {
        filesystem.writeFile(name, data, function (err) {
            if (err) {
                console.log(err);
            }
        });
    };
    const deleteFile = name => {
        if (filesystem.existsSync(name)) {
            try {
                filesystem.unlinkSync(name);
            } catch (err) {
                console.error(err);
                return;
            }
        }
    }

    return {
        deleteAllFiles: () => {
            for (const file of Object.values(files)) {
                this.deleteFile(file)
            }
        },
        saveToJSON: (data) => {
            this.saveToFile(files.JSON, data)
        },
        saveToCSV: (data) => {
            this.saveToFile(files.CSV, data)
        }
    }
}