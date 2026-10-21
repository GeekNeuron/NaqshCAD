import { HISTORY_LIMIT } from './config.js';

function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return h;
}

function describeObject(o) {
    const d = o.data || {};
    if (d.type === 'wall-system') return 'Wall';
    if (d.type === 'room') return 'Room';
    if (d.type === 'door') return 'Door';
    if (d.type === 'window') return 'Window';
    if (d.type === 'stairs') return 'Stairs';
    if (d.type === 'furniture') return d.name || 'Furniture';
    if (d.type === 'user-group') return 'Group';
    if (d.layer === 'dimensions') return 'Dimension';
    if (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox') return 'Text';
    return 'Object';
}

function summarize(data) {
    return (data.objects || []).map(o => ({ h: hashString(JSON.stringify(o)), k: describeObject(o) }));
}

function subtract(a, b) {
    const counts = new Map();
    b.forEach(i => counts.set(i.h, (counts.get(i.h) || 0) + 1));
    const rest = [];
    a.forEach(i => {
        const c = counts.get(i.h) || 0;
        if (c > 0) counts.set(i.h, c - 1);
        else rest.push(i);
    });
    return rest;
}

function nameOf(items) {
    return items.length === 1 ? items[0].k : `${items.length} objects`;
}

function diffLabel(prev, next) {
    if (!prev) return 'Start';
    const added = subtract(next, prev);
    const removed = subtract(prev, next);
    if (added.length && !removed.length) return `Add ${nameOf(added)}`;
    if (removed.length && !added.length) return `Delete ${nameOf(removed)}`;
    if (added.length && removed.length) {
        if (added.length === removed.length) return `Edit ${nameOf(added)}`;
        return 'Modify objects';
    }
    return 'Update';
}

export function createHistoryManager(canvas, { undoBtn, redoBtn, onRestore, onChange } = {}) {
    let history = [];
    let redoStack = [];
    let isProcessingHistory = false;

    function notify() {
        if (undoBtn) undoBtn.disabled = history.length <= 1;
        if (redoBtn) redoBtn.disabled = redoStack.length === 0;
        if (onChange) onChange();
    }

    function updateUndoRedoButtons() {
        notify();
    }

    function saveState(label) {
        if (isProcessingHistory) return;
        redoStack = [];
        const data = canvas.toJSON(['data', 'name']);
        const summary = summarize(data);
        const previous = history.length ? history[history.length - 1].summary : null;
        history.push({
            json: JSON.stringify(data),
            summary,
            label: label || diffLabel(previous, summary),
            time: Date.now()
        });
        if (history.length > HISTORY_LIMIT) history.shift();
        notify();
    }

    function restore(entry) {
        isProcessingHistory = true;
        canvas.loadFromJSON(entry.json, () => {
            canvas.renderAll();
            isProcessingHistory = false;
            notify();
            if (onRestore) onRestore();
        });
    }

    function undo() {
        if (history.length > 1) {
            redoStack.push(history.pop());
            restore(history[history.length - 1]);
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const next = redoStack.pop();
            history.push(next);
            restore(next);
        }
    }

    function jumpTo(index) {
        const full = history.concat(redoStack.slice().reverse());
        if (index < 0 || index >= full.length || index === history.length - 1) return;
        history = full.slice(0, index + 1);
        redoStack = full.slice(index + 1).reverse();
        restore(history[history.length - 1]);
    }

    function reset() {
        history = [];
        redoStack = [];
        notify();
    }

    function getEntries() {
        const current = history.length - 1;
        return history.concat(redoStack.slice().reverse()).map((e, i) => ({
            label: e.label,
            time: e.time,
            current: i === current,
            future: i > current
        }));
    }

    function exportState() {
        return { history: history.slice(), redoStack: redoStack.slice() };
    }

    function importState(state) {
        history = state && Array.isArray(state.history) ? state.history.slice() : [];
        redoStack = state && Array.isArray(state.redoStack) ? state.redoStack.slice() : [];
        notify();
    }

    return { saveState, undo, redo, jumpTo, updateUndoRedoButtons, reset, getEntries, exportState, importState };
}
