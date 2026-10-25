from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':860},accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('dialog',lambda d:d.accept(d.default_value or 'Upper'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#rect-tool-btn'); pg.mouse.move(box['x']+200,box['y']+200); pg.mouse.down(); pg.mouse.move(box['x']+440,box['y']+360,steps=5); pg.mouse.up(); pg.mouse.click(box['x']+440,box['y']+360); pg.wait_for_timeout(300)
    pg.click('#wall-tool-btn')
    for x,y in [(500,200),(700,200),(700,360)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn'); pg.wait_for_timeout(200)
    pg.mouse.click(box['x']+320,box['y']+280); pg.wait_for_timeout(300)
    print('metric width:', pg.input_value('.prop-item:has(label:text-is("Width")) input'))
    pg.click('#settings-btn'); pg.select_option('[data-key="units"]','imperial'); pg.wait_for_timeout(300); pg.click('#close-settings-modal-btn')
    print('imperial width:', pg.input_value('.prop-item:has(label:text-is("Width")) input'))
    pg.mouse.move(box['x']+600,box['y']+500); pg.wait_for_timeout(200)
    print('coords:', pg.inner_text('#coords-display'))
    pg.screenshot(path='/tmp/t/H_imperial.png')
    pg.click('#settings-btn'); pg.select_option('[data-key="units"]','metric'); pg.click('#close-settings-modal-btn')
    for bid,name in [('export-png-btn','png'),('export-svg-btn','svg'),('export-pdf-btn','pdf')]:
        pg.click('#file-menu-btn')
        with pg.expect_download() as d: pg.click('#'+bid)
        path='/tmp/t/exp.'+name; d.value.save_as(path)
        data=open(path,'rb').read(); print(name, len(data), data[:8])
    print('errs',errs); b.close()
