const _ = require('underscore');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const runtime_values = require('./runtime');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ''
});

// TODO: File Validity Check and Schema Validation
module.exports = (filePath) => {
    const xmlData = fs.readFileSync(filePath, 'utf8');
    const json = jsonObject = parser.parse(xmlData);
    const TableData = json['LinkStorage']['LinkTableImportExportInfoV2'];
    const x_data = _.uniq(TableData['XAxisValues'].split(',').map(Number));
    // Remove duplicates, weird bug in the Link lte format
    const y_data = _.uniq(TableData['YAxisValues'].split(',').map(Number));
    const col_count = Number(TableData['ColumnCount']);
    const z_flat = TableData['CellValues'].split(',');
    // Init z data (2D array)
    let z = [];
    for (let i = 0; i < y_data.length; i++) {
        z.push([]);
    }
    // Populate Z values
    for (let i = 0; i < z_flat.length; i++) {
        const x = Math.floor(i / (col_count));
        const y = i % (col_count);
        z[x][y] = Number(z_flat[i]);
    }
    return {
        x_label: runtime_values[Number(TableData['XAxisFunction'])],
        y_label: runtime_values[Number(TableData['YAxisFunction'])],
        row_count: x_data.length,
        col_count,
        x_data,
        y_data,
        z
    }
}