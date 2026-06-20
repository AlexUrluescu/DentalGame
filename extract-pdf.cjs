const fs = require('fs');
const path = require('path');

async function extractText() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const pdfPath = path.join(process.cwd(), 'documentation', 'CURS PARAZITOZE.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    
    const doc = await pdfjsLib.getDocument({ data }).promise;
    console.log('Total pages:', doc.numPages);
    
    let allText = '';
    
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        allText += `\n--- PAGE ${i} ---\n` + pageText + '\n';
    }
    
    fs.writeFileSync('documentation/extracted-text.txt', allText);
    console.log('Text length:', allText.length);
    console.log('\n--- FIRST 8000 CHARS ---\n');
    console.log(allText.substring(0, 8000));
    console.log('\n--- CHARS 20000-28000 ---\n');
    console.log(allText.substring(20000, 28000));
}

extractText().catch(err => console.error('Error:', err));
