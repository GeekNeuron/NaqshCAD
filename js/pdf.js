function encode(text) {
    return new TextEncoder().encode(text);
}

function concat(parts) {
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    parts.forEach(p => { out.set(p, offset); offset += p.length; });
    return out;
}

export function dataUrlToBytes(dataUrl) {
    const binary = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export function buildPdf(pages) {
    const objects = [];
    const kids = [];
    const pageObjectStart = 3;
    pages.forEach((page, i) => {
        const landscape = page.width >= page.height;
        const pw = landscape ? 842 : 595;
        const ph = landscape ? 595 : 842;
        const margin = 28;
        const scale = Math.min((pw - margin * 2) / page.width, (ph - margin * 2) / page.height);
        const w = page.width * scale;
        const h = page.height * scale;
        const x = (pw - w) / 2;
        const y = (ph - h) / 2;
        const base = pageObjectStart + i * 3;
        kids.push(`${base} 0 R`);
        const content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
        objects[base] = [encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${base + 1} 0 R >> >> /Contents ${base + 2} 0 R >>`)];
        objects[base + 1] = [encode(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`), page.jpeg, encode('\nendstream')];
        objects[base + 2] = [encode(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)];
    });
    objects[1] = [encode('<< /Type /Catalog /Pages 2 0 R >>')];
    objects[2] = [encode(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`)];

    const chunks = [encode('%PDF-1.4\n')];
    const offsets = [];
    let position = chunks[0].length;
    for (let n = 1; n < objects.length; n++) {
        offsets[n] = position;
        const body = concat([encode(`${n} 0 obj\n`)].concat(objects[n], [encode('\nendobj\n')]));
        chunks.push(body);
        position += body.length;
    }
    let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let n = 1; n < objects.length; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
    xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`;
    chunks.push(encode(xref));
    return new Blob([concat(chunks)], { type: 'application/pdf' });
}
