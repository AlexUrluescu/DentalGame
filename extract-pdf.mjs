import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = path.join(process.cwd(), 'documentation', 'Odontoterapie.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    // Save extracted text
    fs.writeFileSync('documentation/extracted-text.txt', data.text);
    console.log('Pages:', data.numpages);
    console.log('Text length:', data.text.length);
    // Print first 5000 chars to understand structure
    console.log('\n--- FIRST 5000 CHARS ---\n');
    console.log(data.text.substring(0, 5000));
    console.log('\n--- CHARS 5000-10000 ---\n');
    console.log(data.text.substring(5000, 10000));
    console.log('\n--- CHARS 10000-15000 ---\n');
    console.log(data.text.substring(10000, 15000));
});
