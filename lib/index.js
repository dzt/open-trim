const fs = require('fs');
const parser = require('./table_parser');
const utils = require('./utils');

class TrimAPI {

    constructor(file_path, config) {
        this.analyzed = false;
        this.parsed = false;
        this.file_path = file_path;
        try {
            this.table_data = parser(file_path);
            this.parsed = true;
            // Pre-populate for analysis function call
            this.stats = this.table_data.z.map(row => {
                return row.map(ve => {
                    return {
                        visited: false,
                        table_ve: ve,
                        sample_count: 0,
                        median_afr: 0,
                        average_afr: 0,
                        median_correction: 0.0,
                        afr_samples: [],
                        correction_samples: []
                    }
                });
            });;
            // stores relevent keys from log file for analysis
            this.header_config = null;
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
            if (data['Name'] == 'Section Time') {
                // TODO: Should throw error if this step fails as its needed to continue
                this.header_config = utils.setupHeaderData(data);
            } else if (data['Name'] !== 's' && data['Name'] != '' && Object.keys(data).length != 0) {
                const sample = parseSample(this.header_config, data);
                const ve_cell = utils.locateCell(table_data.y_data, table_data.x_data, sample.mgp, sample.rpm); // y = col, x = row
                const cell = histo_data[ve_cell.y][ve_cell.x];
                if (ve_cell.score >= 80 && sample.tps_delta < 0.5) {
                    cell.visited = true;
                    cell.sample_count++;
                    cell.afr_samples.push(sample.afr_actual);
                    cell.correction_samples.push(sample.afr_actual / sample.afr_target);
                    cell.afr_samples.sort((a, b) => a - b);
                    cell.correction_samples.sort((a, b) => a - b);
                    const sum = cell.afr_samples.reduce((acc, val) => acc + val, 0);
                    cell.average_afr = Number((sum / cell.sample_count).toFixed(2));
                    cell.median_afr = Number(utils.getMedian(cell.afr_samples).toFixed(2));
                    cell.median_correction = Number(utils.getMedian(cell.correction_samples).toFixed(2));
                }
            }
        }).on('end', () => {
            this.analyze = true;
        });
    }

    // type: base, correction, adjusted_ve, hit_count
    getTable(type = 'base', reverse_load) {
        let table = [['Load/RPM', ...table_data.x_data]];
        for (let row = 0; row < histo_data.length; row++) {
            let arr = [table_data.y_data[row], ...histo_data[row].map(x => {
                if (x.visited) {
                    // TODO fetch from type
                    return x.median_correction.toFixed(2);
                }
                return ''
            })]
            (reverse_load) ? table.unshift(arr) : table.push(arr);
        }
        return table;
    }
    
}

module.exports = TrimAPI;
