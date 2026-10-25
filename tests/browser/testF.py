from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':800}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    def fix(route):
        body=route.fetch().text()
        route.fulfill(body=body.replace('fillet: true, wallGraph: true, nodeEdit: true, liveRecolor: true, ghostFloor: true, normalizeWalls: true, roomHoles: true, allFloorsExport: true, graphPersist: true','fillet: false, wallGraph: false, nodeEdit: false, liveRecolor: false, ghostFloor: false, normalizeWalls: false, roomHoles: false, allFloorsExport: false, graphPersist: false'),content_type='application/javascript')
    pg.route('**/js/config.js',fix)
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(800)
    print('node btn',pg.locator('#node-tool-btn').count(),'ghost label',pg.locator('#ghost-floor-label').count());print('fillet btn',pg.locator('#fillet-tool-btn').count(),'graph btn',pg.locator('#graph-tool-btn').count(),'chamfer btn',pg.locator('#chamfer-tool-btn').count(),'floors',pg.locator('.floor-item').count(),'errs',errs)
    b.close()
