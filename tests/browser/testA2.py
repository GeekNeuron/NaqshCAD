from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':900})
    errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('dialog',lambda d:d.accept(d.default_value or 'X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    def room(x,y,w,h):
        pg.click('#rect-tool-btn'); pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.down(); pg.mouse.move(box['x']+x+w,box['y']+y+h,steps=5); pg.mouse.up(); pg.mouse.click(box['x']+x+w,box['y']+y+h); pg.wait_for_timeout(300)
    room(200,200,200,120); room(450,300,150,100); room(650,200,100,100)
    pg.click('#undo-btn'); pg.wait_for_timeout(400)
    print([e.text_content()+('~' if 'future' in e.get_attribute('class') else '') for e in pg.locator('.history-item').all()])
    pg.click('.history-item:nth-child(2)'); pg.wait_for_timeout(500)
    print([e.text_content()+('~' if 'future' in e.get_attribute('class') else '')+('*' if 'current' in e.get_attribute('class') else '') for e in pg.locator('.history-item').all()])
    pg.click('.history-item:nth-child(4)'); pg.wait_for_timeout(500)
    print([e.text_content()+('*' if 'current' in e.get_attribute('class') else '') for e in pg.locator('.history-item').all()])
    pg.screenshot(path='/tmp/t/A_history.png')
    print(errs)
    b.close()
