const fs = require('fs');
const parser = require('./table_parser');
const utils = require('./utils');

class TrimAPI {

    constructor(file_path) {
        this.analyzed = false;
        this.parsed = false;
        this.file_path = file_path;
        try {
            this.table_data = parser(file_path);
            this.parsed = true;
        } catch (e) {
            throw new Error('Unable to load data with file path given');
        }
    }

    getTableDetails() {
        return this.table_data;
    }

    getCell(load, rpm) {
        const rpm_header = this.table_data.x_data;
        const load_header = this.table_data.y_data;
        return utils.locateCell(load_header, rpm_header, load, rpm);
    }

    async analyze(csv_file_path) {
        if (!this.parsed) throw new Error('Invalid path/file provided.');
        fs.createReadStream(csv_file_path).pipe(csv()).on('data', (data) => {
            
        }).on('end', () => {
        });
    }

    getTable(type = 'base') {
        // type: base, correction, adjusted_ve, hit_count
    }
    
}

module.exports = TrimAPI;
