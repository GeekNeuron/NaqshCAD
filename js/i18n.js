import { FA, FA_PATTERNS } from './fa.js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ATTRS = ['title', 'placeholder', 'aria-label'];
const textOriginal = new WeakMap();
const textApplied = new WeakMap();
const attrOriginal = new WeakMap();
let language = 'en';
let digits = false;
let observer = null;
let busy = false;
const makeRef = typeof WeakRef === 'function' ? (n) => new WeakRef(n) : (n) => ({ deref: () => n });
const trackedText = new Set();
const trackedNodes = new WeakSet();
const trackedElements = new Set();
const trackedEls = new WeakSet();

function toDigits(text) {
    return text.replace(/[0-9]/g, d => PERSIAN_DIGITS[Number(d)]);
}

function translateString(text) {
    const key = text.trim();
    let out = null;
    if (Object.prototype.hasOwnProperty.call(FA, key)) {
        out = FA[key];
    } else {
        for (const [pattern, build] of FA_PATTERNS) {
            const match = key.match(pattern);
            if (match) { out = build(match); break; }
        }
    }
    if (out === null && !digits) return text;
    if (out === null) out = key;
    if (digits) out = toDigits(out);
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    return lead + out + trail;
}

function processTextNode(node) {
    const applied = textApplied.get(node);
    if (applied !== undefined && node.nodeValue === applied) return;
    const original = node.nodeValue;
    textOriginal.set(node, original);
    const next = translateString(original);
    if (next !== original) {
        textApplied.set(node, next);
        node.nodeValue = next;
        if (!trackedNodes.has(node)) { trackedNodes.add(node); trackedText.add(makeRef(node)); }
    } else {
        textApplied.delete(node);
    }
}

function processElementAttrs(el) {
    ATTRS.forEach(attr => {
        if (!el.hasAttribute || !el.hasAttribute(attr)) return;
        const store = attrOriginal.get(el) || {};
        const current = el.getAttribute(attr);
        if (store[attr] && store[attr].applied === current) return;
        const next = translateString(current);
        store[attr] = { original: current, applied: next };
        attrOriginal.set(el, store);
        if (next !== current) el.setAttribute(attr, next);
        if (!trackedEls.has(el)) { trackedEls.add(el); trackedElements.add(makeRef(el)); }
    });
}

function walk(root) {
    if (root.nodeType === 3) { processTextNode(root); return; }
    if (root.nodeType !== 1) return;
    const tag = root.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS' || tag === 'TEXTAREA') return;
    processElementAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
        if (node.nodeType === 3) {
            const parent = node.parentNode;
            if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE' && parent.tagName !== 'TEXTAREA') processTextNode(node);
        } else if (node.tagName !== 'CANVAS') {
            processElementAttrs(node);
        }
        node = walker.nextNode();
    }
}

function applyAll() {
    busy = true;
    walk(document.body);
    busy = false;
}

function revertAll() {
    busy = true;
    trackedText.forEach(ref => {
        const node = ref.deref();
        if (!node) { trackedText.delete(ref); return; }
        const applied = textApplied.get(node);
        if (applied !== undefined && node.nodeValue === applied) node.nodeValue = textOriginal.get(node);
        textApplied.delete(node);
    });
    trackedElements.forEach(ref => {
        const el = ref.deref();
        if (!el) { trackedElements.delete(ref); return; }
        const store = attrOriginal.get(el);
        if (store) {
            Object.keys(store).forEach(attr => {
                if (el.getAttribute(attr) === store[attr].applied) el.setAttribute(attr, store[attr].original);
            });
            attrOriginal.delete(el);
        }
    });
    busy = false;
}

function startObserver() {
    if (observer) return;
    observer = new MutationObserver((records) => {
        if (busy || language === 'en') return;
        busy = true;
        records.forEach(r => {
            if (r.type === 'childList') r.addedNodes.forEach(n => walk(n));
            else if (r.type === 'characterData') processTextNode(r.target);
            else if (r.type === 'attributes') processElementAttrs(r.target);
        });
        busy = false;
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export function setLanguage(next, persianDigits) {
    const changed = next !== language || !!persianDigits !== digits;
    if (!changed) return;
    if (language !== 'en') revertAll();
    language = next === 'fa' ? 'fa' : 'en';
    digits = language === 'fa' && !!persianDigits;
    document.documentElement.lang = language;
    document.body.classList.toggle('lang-fa', language === 'fa');
    if (language === 'fa') {
        startObserver();
        applyAll();
    }
}
