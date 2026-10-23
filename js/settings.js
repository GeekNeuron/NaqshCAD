export const SETTINGS_KEY = 'naqshcad-settings';

export const DEFAULT_SETTINGS = {
    theme: 'dark',
    language: 'en',
    persianDigits: false,
    accent: 'default',
    reduceMotion: false,
    largeTargets: false,
    showGrid: true,
    showRulers: true,
    showHints: true,
    units: 'metric',
    snapGrid: true,
    objectSnap: true,
    objectSnapThreshold: 8,
    wallThickness: 5,
    filletRadius: 0.5,
    chamferDistance: 0.3,
    graphAuto: false,
    showFloorBelow: false,
    autosave: 0,
    historyLimit: 50,
    confirmDestructive: true
};

export const SETTINGS_SCHEMA = [
    {
        title: 'Appearance',
        items: [
            { key: 'theme', label: 'Theme', type: 'select', options: [['dark', 'Dark'], ['light', 'Light'], ['system', 'Match system']] },
            { key: 'language', label: 'Language', type: 'select', options: [['en', 'English'], ['fa', 'فارسی']] },
            { key: 'persianDigits', label: 'Persian digits', type: 'toggle' },
            { key: 'accent', label: 'Accent color', type: 'select', options: [['default', 'Theme default'], ['#e94560', 'Red'], ['#4285f4', 'Blue'], ['#1fa971', 'Green'], ['#8e5cf0', 'Purple'], ['#f08c1f', 'Orange']] },
            { key: 'largeTargets', label: 'Large touch targets', type: 'toggle', hint: 'Bigger buttons, useful on phones and tablets.' },
            { key: 'reduceMotion', label: 'Reduce animations', type: 'toggle' }
        ]
    },
    {
        title: 'Canvas',
        items: [
            { key: 'showGrid', label: 'Show grid', type: 'toggle' },
            { key: 'showRulers', label: 'Show rulers', type: 'toggle' },
            { key: 'showHints', label: 'Show tool hints in the status bar', type: 'toggle' },
            { key: 'units', label: 'Units', type: 'select', options: [['metric', 'Metric (m)'], ['imperial', 'Imperial (ft-in)']], hint: 'Panels, status bar and new labels. Fillet and chamfer inputs stay in metres.' }
        ]
    },
    {
        title: 'Drawing',
        items: [
            { key: 'snapGrid', label: 'Snap to grid', type: 'toggle' },
            { key: 'objectSnap', label: 'Object snap guides', type: 'toggle' },
            { key: 'objectSnapThreshold', label: 'Object snap distance (px)', type: 'number', min: 2, max: 20, step: 1 },
            { key: 'wallThickness', label: 'Default wall thickness', type: 'select', options: [[2, 'Thin'], [5, 'Medium'], [10, 'Thick']] },
            { key: 'filletRadius', label: 'Default fillet radius (m)', type: 'number', min: 0.05, max: 10, step: 0.05 },
            { key: 'chamferDistance', label: 'Default chamfer distance (m)', type: 'number', min: 0.05, max: 10, step: 0.05 }
        ]
    },
    {
        title: 'Walls and floors',
        items: [
            { key: 'graphAuto', label: 'Keep walls in graph form automatically', type: 'toggle', hint: 'Rebuilds walls as clean graph chains after each wall you draw.' },
            { key: 'showFloorBelow', label: 'Show the floor below as a faint overlay', type: 'toggle' }
        ]
    },
    {
        title: 'Data and safety',
        items: [
            { key: 'autosave', label: 'Autosave to this browser', type: 'select', options: [[0, 'Off'], [1, 'Every minute'], [5, 'Every 5 minutes'], [10, 'Every 10 minutes']], hint: 'Also saves when the tab is hidden. Stored locally, never uploaded.' },
            { key: 'historyLimit', label: 'Undo history length', type: 'select', options: [[20, '20 steps'], [50, '50 steps'], [100, '100 steps'], [200, '200 steps']] },
            { key: 'confirmDestructive', label: 'Ask before deleting floors or clearing the canvas', type: 'toggle' },
            { type: 'action', action: 'restoreAutosave', label: 'Restore autosave' },
            { type: 'action', action: 'clearAutosave', label: 'Delete autosave' },
            { type: 'action', action: 'exportSettings', label: 'Export settings' },
            { type: 'action', action: 'importSettings', label: 'Import settings' },
            { type: 'action', action: 'resetSettings', label: 'Reset to defaults' }
        ]
    }
];

function findItem(key) {
    for (const section of SETTINGS_SCHEMA) {
        for (const item of section.items) if (item.key === key) return item;
    }
    return null;
}

export function sanitizeSettings(input) {
    const clean = Object.assign({}, DEFAULT_SETTINGS);
    if (!input || typeof input !== 'object') return clean;
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
        if (!(key in input)) return;
        const fallback = DEFAULT_SETTINGS[key];
        const item = findItem(key);
        let value = input[key];
        if (typeof fallback === 'boolean') {
            if (typeof value === 'boolean') clean[key] = value;
        } else if (item && item.type === 'select') {
            const match = item.options.find(o => String(o[0]) === String(value));
            if (match) clean[key] = match[0];
        } else if (typeof fallback === 'number') {
            value = Number(value);
            if (isFinite(value) && item) clean[key] = Math.min(item.max, Math.max(item.min, value));
        }
    });
    return clean;
}

export function loadSettings() {
    try {
        return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch (err) {
        return Object.assign({}, DEFAULT_SETTINGS);
    }
}

export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (err) {
        return false;
    }
}
