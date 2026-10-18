// Load log file
// Parse table data
const _ = require('underscore');
const fs = require('fs');
const csv = require('csv-parser');
const { table } = require('table');
const parser = require('../table_parser');
const utils = require('../utils');

const TABLE_FILE_PATH = '../sample_data/tables/scott_rx7_s5_na_table.lte';
const LOG_FILE_PATH = '../sample_data/logs/scott_rx7_s5_na_log.csv';
const REVERSE_LOAD_AXIS = true;

// Mandatory Log Values
// Engine Speed, TPS (Main), TPS Delta, AFR/Lambda Target, Lambda 1
// MAP or MGP

// Optional: ECT, IAT
// Optional: Idle Status (TODO: Determine exactly the different idle status') 

const setupHeaderData = (payload) => {
    let config = {
        rpm: null,
        tps: null,
        map: null,
        mgp: null,
        tps_delta: null,
        afr_target: null,
        afr_actual: null
    }
    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = payload[key];
        
        switch (value) {
            case 'TPS (Main)':
                config.tps = key;
                break;
            case 'Engine Speed':
                config.rpm = key;
                break;
            case 'AFR/Lambda Target':
                config.afr_target = key;
                break;
            case 'TPS Delta':
                config.tps_delta = key;
                break;
            case 'Lambda 1':
                config.afr_actual = key;
                break;
            case 'MAP':
                config.map = key;
                break;
            case 'MGP':
                config.mgp = key;
                break;
            default:
                break;
        }
    }
    return config;
}

const parseSample = (config, data) => {
    return {
        rpm: Number(data[config.rpm]),
        tps: Number(data[config.tps]),
        map: Number(data[config.map]),
        mgp: Number(data[config.mgp]),
        tps_delta: Number(data[config.tps_delta]),
        afr_target: Number(data[config.afr_target]),
        afr_actual: Number(data[config.afr_actual])
    }
}

let table_data;
try {
    // Parse Table Data
    table_data = parser(TABLE_FILE_PATH);
    const rpm_header = table_data.x_data;
    const load_header = table_data.y_data;
    // Histogram Init
    let histo_data = table_data.z.map(row => {
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
    });

    // console.log(table_data)

    let header_config;
    fs.createReadStream(LOG_FILE_PATH).pipe(csv()).on('data', (data) => {
        if (data['Name'] == 'Section Time') {
            header_config = setupHeaderData(data);
        } else if (data['Name'] !== 's' && data['Name'] != '' && Object.keys(data).length != 0) {
            const sample = parseSample(header_config, data);
            try {
                const cell = utils.locateCell(load_header, rpm_header, sample.mgp, sample.rpm); // y = col, x = row
                if (cell.score >= 80 && sample.tps_delta < 0.5) {
                    
                    histo_data[cell.y][cell.x].visited = true;
                    histo_data[cell.y][cell.x].sample_count++;

                    const corr_factor = sample.afr_actual / sample.afr_target;
                    histo_data[cell.y][cell.x].afr_samples.push(sample.afr_actual);
                    histo_data[cell.y][cell.x].correction_samples.push(corr_factor);
                    
                    // Sort added values
                    histo_data[cell.y][cell.x].afr_samples = _.sortBy(histo_data[cell.y][cell.x].afr_samples);
                    histo_data[cell.y][cell.x].correction_samples = _.sortBy(histo_data[cell.y][cell.x].correction_samples);

                    // Calculations
                    const sum = histo_data[cell.y][cell.x].afr_samples.reduce((ac, current) => ac + current, 0);
                    histo_data[cell.y][cell.x].average_afr = (sum / histo_data[cell.y][cell.x].sample_count);
                    histo_data[cell.y][cell.x].median_afr = utils.getMedian(histo_data[cell.y][cell.x].afr_samples);
                    histo_data[cell.y][cell.x].median_correction = utils.getMedian(histo_data[cell.y][cell.x].correction_samples);

                    // Formatting
                    histo_data[cell.y][cell.x].average_afr = parseFloat(histo_data[cell.y][cell.x].average_afr.toFixed(2));
                    histo_data[cell.y][cell.x].median_afr = parseFloat(histo_data[cell.y][cell.x].median_afr.toFixed(2));
                    histo_data[cell.y][cell.x].median_correction = parseFloat(histo_data[cell.y][cell.x].median_correction.toFixed(2));
                }
            } catch (e) {
                // console.error(e)
                console.error(`Could not locate ${sample.mgp}MGP @ ${sample.rpm}rpm`);
            }
        }
    }).on('end', () => {
        let print_table = [
            ['Load/RPM', ...table_data.x_data],
        ];
        if (REVERSE_LOAD_AXIS) {
            for (let row = histo_data.length - 1; row >= 0; row--) {
                let arr = [table_data.y_data[row], ...histo_data[row].map(x => {
                    if (x.visited) return x.median_correction.toFixed(2);
                    return ''
                })]
                print_table.push(arr);
            }
        } else {
            for (let row = 0; row < histo_data.length; row++) {
                let arr = [table_data.y_data[row], ...histo_data[row].map(x => {
                    if (x.visited) return x.median_correction.toFixed(2);
                    return ''
                })]
                print_table.push(arr);
            }
        }
        console.log(table(print_table));
    });

} catch (e) {
    console.error(e);
}