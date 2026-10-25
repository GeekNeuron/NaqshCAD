from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':860}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#wall-tool-btn')
    for x,y in [(200,200),(520,200),(520,420)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn'); pg.wait_for_timeout(200)
    P=lambda tag: print(tag, pg.inner_text('#panel-content')[:30].replace('\n','|'), '| lang:', pg.evaluate("document.documentElement.lang"))
    pg.click('#settings-btn'); pg.select_option('[data-key="units"]','imperial'); pg.wait_for_timeout(200); pg.select_option('[data-key="language"]','fa'); pg.wait_for_timeout(300); pg.click('#close-settings-modal-btn'); P('A')
    pg.click('#fillet-tool-btn'); pg.wait_for_timeout(200); pg.fill('#fillet-radius','2'); pg.click('#fillet-apply-btn'); pg.wait_for_timeout(200); P('B')
    pg.mouse.click(box['x']+520,box['y']+200); pg.wait_for_timeout(300); P('C')
    pg.click('#settings-btn'); pg.select_option('[data-key="units"]','metric'); pg.select_option('[data-key="language"]','en'); pg.click('#close-settings-modal-btn'); P('D')
    pg.wait_for_timeout(300); P('E')
    pg.click('#select-tool-btn'); pg.wait_for_timeout(300); P('F'); print(errs); b.close()
