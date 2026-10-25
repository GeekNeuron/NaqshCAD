from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':860}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#wall-tool-btn')
    for x,y in [(200,200),(500,200),(500,400)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn'); pg.click('#settings-btn'); pg.wait_for_timeout(300)
    pg.select_option('[data-key="language"]','fa'); pg.wait_for_timeout(400)
    pg.check('[data-key="persianDigits"]'); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/t/L_settings_fa.png')
    pg.click('#close-settings-modal-btn'); pg.wait_for_timeout(200)
    pg.mouse.move(box['x']+300,box['y']+300); pg.wait_for_timeout(200)
    pg.click('#file-menu-btn'); pg.wait_for_timeout(200)
    pg.screenshot(path='/tmp/t/L_main_fa.png')
    print('title attr:', pg.get_attribute('#wall-tool-btn','title'), '| zoom:', pg.inner_text('#zoom-display') if pg.locator('#zoom-display').count() else '')
    print('history:', [e.text_content() for e in pg.locator('.history-item').all()])
    pg.keyboard.press('Escape'); pg.click('#settings-btn'); pg.select_option('[data-key="language"]','en'); pg.wait_for_timeout(300); pg.click('#close-settings-modal-btn')
    print('back to en title:', pg.get_attribute('#wall-tool-btn','title'), '| history:', [e.text_content() for e in pg.locator('.history-item').all()], '| settings label:', end=' ')
    pg.click('#settings-btn'); print(pg.inner_text('.settings-section h4 >> nth=0')); print('errs',errs); b.close()
