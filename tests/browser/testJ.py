from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':860}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#rect-tool-btn'); pg.mouse.move(box['x']+200,box['y']+200); pg.mouse.down(); pg.mouse.move(box['x']+500,box['y']+400,steps=5); pg.mouse.up(); pg.mouse.click(box['x']+500,box['y']+400); pg.wait_for_timeout(300)
    def count():
        pg.click('#file-menu-btn'); pg.click('#report-btn'); pg.wait_for_timeout(700)
        t=pg.inner_text('#report-body'); pg.click('#close-report-modal-btn'); return 'Sofa' in t
    pg.click('#asset-tool-btn'); pg.wait_for_timeout(300)
    pg.click('.asset-item[title="Sofa"]'); pg.mouse.click(box['x']+300,box['y']+300); pg.wait_for_timeout(600)
    print('sofa inside room counted:', count())
    pg.click('#asset-tool-btn'); pg.click('.asset-item[title="Sofa"]'); pg.mouse.click(box['x']+700,box['y']+300); pg.wait_for_timeout(600)
    print('sofa outside room counted:', count()); print(errs); b.close()
