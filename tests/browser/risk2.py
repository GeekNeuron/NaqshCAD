from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page(); dialogs=[]; errs=[]
    pg.on('dialog',lambda d:(dialogs.append(d.message),d.accept())); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html#p=gNotValid!!'); pg.wait_for_timeout(1200)
    print('broken link ->', dialogs, errs)
    pg.goto('about:blank'); pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    pg.click('#settings-btn'); pg.select_option('[data-key="autosave"]','1'); pg.click('#close-settings-modal-btn')
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#wall-tool-btn')
    for x,y in [(200,200),(500,200)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn')
    pg.evaluate("(()=>{const chunk='x'.repeat(100*1024);let i=0;try{for(;;){localStorage.setItem('junk'+i,chunk);i++;}}catch(e){} try{for(;;){localStorage.setItem('tiny'+i,'xxxxxxxxxx');i++;}}catch(e){} })()")
    pg.evaluate("Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(400)
    print('quota tip ->', pg.inner_text('#tool-tip'))
    pg.click('#settings-btn'); pg.select_option('[data-key="units"]','imperial'); pg.wait_for_timeout(200)
    print('settings save under full storage did not throw; units now', pg.input_value('[data-key="units"]'), errs)
    b.close()
