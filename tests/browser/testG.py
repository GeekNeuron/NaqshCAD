from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('dialog',lambda d:d.accept(d.default_value or 'Upper'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    def wall(pts):
        pg.click('#wall-tool-btn'); pg.wait_for_timeout(80)
        for x,y in pts:
            pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
        pg.click('#select-tool-btn'); pg.wait_for_timeout(250)
    def summary():
        pg.click('#graph-tool-btn'); pg.wait_for_timeout(250); t=pg.inner_text('#graph-summary').replace('\n',' | ')[:150]; pg.click('#close-graph-modal-btn'); return t
    def save(path):
        pg.click('#file-menu-btn')
        with pg.expect_download() as d: pg.click('#save-btn')
        d.value.save_as(path)
    pg.click('#graph-tool-btn'); pg.check('#graph-auto-toggle'); pg.click('#close-graph-modal-btn')
    wall([(150,150),(450,150),(450,350),(150,350),(150,150)]); wall([(300,100),(300,400)])
    pg.click('#add-floor-btn'); pg.wait_for_timeout(500)
    wall([(200,200),(400,200),(400,300)])
    save('/tmp/t/gp.gncad'); data=json.load(open('/tmp/t/gp.gncad'))
    print('floors graph', [(f['name'], None if not f['graph'] else (f['graph']['authoritative'], len(f['graph']['nodes']), len(f['graph']['edges']))) for f in data['meta']['floors']])
    pg.click('.floor-item:first-child'); print('floor1 before', summary())
    pg.click('#file-menu-btn'); pg.click('#new-btn'); pg.wait_for_timeout(300)
    pg.set_input_files('#file-input','/tmp/t/gp.gncad'); pg.wait_for_timeout(900)
    print('floor active after load', pg.evaluate("document.querySelector('.floor-item.active').textContent.trim()"))
    pg.click('.floor-item:first-child'); pg.wait_for_timeout(500); print('floor1 after load', summary())
    pg.click('.floor-item:nth-child(2)'); pg.wait_for_timeout(500); print('floor2 after load', summary())
    d=json.load(open('/tmp/t/gp.gncad'))
    act=d['meta']['activeFloorId']
    d['canvasData']['objects']=[o for o in d['canvasData']['objects'] if (o.get('data') or {}).get('type')!='wall-system']
    for f in d['meta']['floors']:
        if f['json']: f['json']['objects']=[o for o in f['json']['objects'] if (o.get('data') or {}).get('type')!='wall-system']
    json.dump(d,open('/tmp/t/gp_tampered.gncad','w'))
    pg.click('#file-menu-btn'); pg.click('#new-btn'); pg.wait_for_timeout(300)
    pg.set_input_files('#file-input','/tmp/t/gp_tampered.gncad'); pg.wait_for_timeout(900)
    print('tampered: walls restored from graph ->', summary()[:60], '| tip:', pg.inner_text('#tool-tip')[:60])
    pg.click('.floor-item:first-child'); pg.wait_for_timeout(500); print('tampered floor1 ->', summary()[:60])
    pg.click('#file-menu-btn'); pg.click('#new-btn'); pg.wait_for_timeout(300)
    pg.set_input_files('#file-input','/tmp/t/g.gncad'); pg.wait_for_timeout(900)
    print('legacy file ->', summary()[:60])
    print('errs',errs); b.close()
