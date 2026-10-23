const FEET_PER_METER = 3.280839895;
const SQFT_PER_SQM = 10.7639104;
let system = 'metric';

export function setUnitSystem(value) {
    system = value === 'imperial' ? 'imperial' : 'metric';
}

export function getUnitSystem() {
    return system;
}

export function lengthUnit() {
    return system === 'imperial' ? 'ft' : 'm';
}

export function areaUnit() {
    return system === 'imperial' ? 'ft²' : 'm²';
}

export function toDisplayLength(meters) {
    return system === 'imperial' ? meters * FEET_PER_METER : meters;
}

export function fromDisplayLength(value) {
    return system === 'imperial' ? value / FEET_PER_METER : value;
}

export function toDisplayArea(squareMeters) {
    return system === 'imperial' ? squareMeters * SQFT_PER_SQM : squareMeters;
}

function feetInches(meters) {
    const totalInches = Math.round(meters * 39.3700787);
    return `${Math.floor(totalInches / 12)}'-${totalInches % 12}"`;
}

export function formatLabel(meters) {
    return system === 'imperial' ? feetInches(meters) : `${meters.toFixed(2)}m`;
}

export function formatLength(meters) {
    return system === 'imperial' ? feetInches(meters) : `${meters.toFixed(2)} m`;
}

export function formatArea(squareMeters) {
    return `${toDisplayArea(squareMeters).toFixed(2)} ${areaUnit()}`;
}
