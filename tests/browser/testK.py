from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':860}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#wall-tool-btn')
    for x,y in [(200,300),(600,300)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn'); pg.wait_for_timeout(250)
    for tool,x in [('door',300),('window',450)]:
        pg.click(f'#{tool}-tool-btn'); pg.mouse.move(box['x']+x,box['y']+300); pg.wait_for_timeout(150); pg.mouse.click(box['x']+x,box['y']+300); pg.wait_for_timeout(400)
    pg.click('#select-tool-btn')
    pg.click('#file-menu-btn'); pg.click('#report-btn'); pg.wait_for_timeout(800)
    print(pg.inner_text('#report-body').replace('\n',' | ')[:420]); print(errs); b.close()
