function exportToDXF(canvas) {
    return exportFloorsToDXF([{ name: '0', objects: canvas.getObjects() }]);
}

function exportFloorsToDXF(groups) {
    let dxf = '';
    let layerTable = `0\nTABLE\n2\nLAYER\n70\n${groups.length}\n`;
    groups.forEach(group => {
        layerTable += `0\nLAYER\n2\n${group.name}\n70\n0\n62\n7\n6\nCONTINUOUS\n`;
    });
    layerTable += '0\nENDTAB\n';
    const header = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLTYPE\n70\n1\n0\nLTYPE\n2\nCONTINUOUS\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n0\nENDTAB\n${layerTable}0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
    dxf += header.trim() + '\n';

    groups.forEach(group => {
        group.objects.forEach(obj => {
            dxf += entitiesForObject(obj, group.name);
        });
    });

    dxf += '0\nENDSEC\n0\nEOF\n';
    return dxf;
}

function entitiesForObject(obj, layer) {
    let dxf = '';
    if (obj.name === 'grid' || obj.name === 'temp' || (obj.data && obj.data.isDimensionLabel)) return dxf;

    if (obj.data && obj.data.type === 'room') {
        if (obj.type === 'polygon') {
            dxf += polylineToDxf(absolutePolygonPoints(obj), true, layer);
        } else {
            const rect = obj._objects.find(o => o.type === 'rect');
            if (rect) dxf += rectToDxf(rect, obj.getCenterPoint(), obj.angle, layer);
        }
    } else if (obj.data && obj.data.type === 'wall-system' && Array.isArray(obj.points)) {
        const matrix = obj.calcTransformMatrix();
        const offset = obj.pathOffset || { x: 0, y: 0 };
        const absPoints = obj.points.map(p => fabric.util.transformPoint({ x: p.x - offset.x, y: p.y - offset.y }, matrix));
        for (let i = 0; i < absPoints.length - 1; i++) {
            dxf += lineToDxf(absPoints[i], absPoints[i + 1], layer);
        }
    } else if (obj.data && obj.data.layer === 'dimensions') {
        const line = obj._objects && obj._objects.find(o => o.type === 'line');
        if (line) {
            const matrix = obj.calcTransformMatrix();
            const p1 = fabric.util.transformPoint({ x: line.x1, y: line.y1 }, matrix);
            const p2 = fabric.util.transformPoint({ x: line.x2, y: line.y2 }, matrix);
            dxf += lineToDxf(p1, p2, layer);
        }
    } else if (obj.data && (obj.data.type === 'door' || obj.data.type === 'window' || obj.data.type === 'stairs' || obj.data.type === 'furniture')) {
        const w = obj.getScaledWidth();
        const h = obj.getScaledHeight();
        dxf += boxToDxf(w, h, obj.getCenterPoint(), obj.angle, layer);
    }
    return dxf;
}

function lineToDxf(p1, p2, layer) {
    let entityDxf = `0\nLINE\n8\n${layer}\n`;
    entityDxf += `10\n${p1.x}\n20\n${-p1.y}\n`;
    entityDxf += `11\n${p2.x}\n21\n${-p2.y}\n`;
    return entityDxf;
}

function absolutePolygonPoints(obj) {
    const matrix = obj.calcTransformMatrix();
    const offset = obj.pathOffset || { x: 0, y: 0 };
    return obj.points.map(p => fabric.util.transformPoint({ x: p.x - offset.x, y: p.y - offset.y }, matrix));
}

function polylineToDxf(points, closed, layer) {
    let entityDxf = `0\nLWPOLYLINE\n8\n${layer}\n90\n${points.length}\n70\n${closed ? 1 : 0}\n`;
    points.forEach(p => {
        entityDxf += `10\n${p.x}\n20\n${-p.y}\n`;
    });
    return entityDxf;
}

function rectToDxf(rect, center, angle, layer) {
    const w = rect.getScaledWidth();
    const h = rect.getScaledHeight();
    return boxToDxf(w, h, center, angle, layer);
}

function boxToDxf(w, h, center, angle, layer) {
    const angleRad = -angle * Math.PI / 180;

    const corners = [
        {x: -w/2, y: -h/2}, {x: w/2, y: -h/2},
        {x: w/2, y: h/2}, {x: -w/2, y: h/2}
    ];

    const finalCorners = corners.map(c => {
        const rotatedX = c.x * Math.cos(angleRad) - c.y * Math.sin(angleRad);
        const rotatedY = c.x * Math.sin(angleRad) + c.y * Math.cos(angleRad);
        return { x: center.x + rotatedX, y: center.y + rotatedY };
    });

    let entityDxf = `0\nLWPOLYLINE\n8\n${layer}\n90\n4\n70\n1\n`;
    finalCorners.forEach(c => {
        entityDxf += `10\n${c.x}\n20\n${-c.y}\n`;
    });
    return entityDxf;
}
