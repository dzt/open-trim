const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const runtime_values = require('../runtime');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ''
});

const xmlData = fs.readFileSync('../sample_data/rx7_6pt_fuel_table.lte', 'utf8');
const json = jsonObject = parser.parse(xmlData);

const TableData = json['LinkStorage']['LinkTableImportExportInfoV2'];

const x_data = TableData['XAxisValues'].split(',').map(Number);
const y_data = TableData['YAxisValues'].split(',').map(Number);
const col_count = Number(TableData['ColumnCount']);
const z_flat = TableData['CellValues'].split(',');

// Init z data (2D array)
let z = [];
for (let i = 0; i < y_data.length; i++) {
    z.push([]);
}

for (let i = 0; i < z_flat.length; i++) {
    const x = Math.floor(i / (col_count));
    const y = i % (col_count);
    // console.log({x, y, z_flat: z_flat[i] })
    z[x][y] = Number(z_flat[i]);
}

console.dir({
    x_label: runtime_values[Number(TableData['XAxisFunction'])],
    y_label: runtime_values[Number(TableData['YAxisFunction'])],
    row_count: x_data.length,
    col_count,
    x_data,
    y_data, z
});