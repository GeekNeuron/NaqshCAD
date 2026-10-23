function toBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
    const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export async function encodeShare(text) {
    const raw = new TextEncoder().encode(text);
    if (typeof CompressionStream === 'undefined') return 'r' + toBase64Url(raw);
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    const packed = new Uint8Array(await new Response(stream).arrayBuffer());
    return 'g' + toBase64Url(packed);
}

export async function decodeShare(code) {
    const kind = code[0];
    const bytes = fromBase64Url(code.slice(1));
    if (kind === 'r') return new TextDecoder().decode(bytes);
    if (kind !== 'g' || typeof DecompressionStream === 'undefined') throw new Error('unsupported');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}
