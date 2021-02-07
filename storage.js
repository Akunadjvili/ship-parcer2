const sanitize = require("sanitize-filename");
const path = require("path");
const filesystem = require("fs");

class FileManager {
    constructor({ file, output }) {
        this.files = {
            json: path.resolve(output, `${file}.json`),
            csv: path.resolve(output, `${file}.csv`),
            list: path.resolve(output, `${file}.rez`)
        };


        this.createDirectory(output);
        return this;
    }
    delete() {
        for (const file of Object.keys(this.files)) {
            if (this.files.hasOwnProperty(file)) {
                if (filesystem.existsSync(this.files[file])) {
                    try {
                        filesystem.unlinkSync(this.files[file]);
                    } catch (err) {
                        console.error(err);
                        return this;
                    }
                }
            }
        }
        return this;
    }

    createDirectory(output) {
        if (!filesystem.existsSync(output)) {
            filesystem.mkdirSync(output);
        }
        return this;
    }

    saveToFile(type, data) {
        filesystem.writeFile(this.files[type], data, function (err) {
            if (err) {
                console.log(err);
                return this;
            }
        });
        return this;
    };
    appendToFile(type, data) {
        filesystem.appendFile(this.files[type], data, function (err) {
            if (err) {
                console.log(err);
                return this;
            }
        });
        return this;
    }

}


module.exports = FileManager