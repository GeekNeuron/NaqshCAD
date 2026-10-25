import json
from playwright.sync_api import sync_playwright
res=[]
def ok(name, cond, extra=''):
    res.append((name, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ')+name, extra)
with sync_playwright() as p:
    b=p.chromium.launch()
    # R3 touch drawing
    ctx=b.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(800)
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.tap('#wall-tool-btn')
    for x,y in [(60,200),(300,200),(300,400)]:
        pg.touchscreen.tap(box['x']+x,box['y']+y); pg.wait_for_timeout(150)
    pg.tap('#select-tool-btn'); pg.wait_for_timeout(300)
    labels=[e.text_content() for e in pg.locator('.history-item').all()]
    ok('touch: single-finger wall drawing', any('Add wall' in l for l in labels), str(labels))
    ok('touch: no errors', not errs, str(errs)); ctx.close()
    # R4 rotation resize in a desktop-like context
    ctx=b.new_context(viewport={'width':390,'height':780}); pg=ctx.new_page(); pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    def dims(): return pg.evaluate("(()=>{const c=document.getElementById('canvas-container');const cv=document.querySelector('canvas.lower-canvas');const r=window.devicePixelRatio||1;return [c.offsetWidth,c.offsetHeight,Math.round(cv.width/r),Math.round(cv.height/r)]})()")
    pg.set_viewport_size({'width':780,'height':390}); pg.wait_for_timeout(600); d=dims()
    ok('rotate: canvas follows container', d[0]==d[2] and d[1]==d[3], str(d)); ctx.close()
    # R5 system theme
    ctx=b.new_context(viewport={'width':1280,'height':800},color_scheme='light'); pg=ctx.new_page(); pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(600)
    pg.click('#settings-btn'); pg.select_option('[data-key="theme"]','system'); pg.wait_for_timeout(300)
    light=pg.evaluate("document.body.classList.contains('light-theme')")
    pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(400)
    dark=pg.evaluate("document.body.classList.contains('dark-theme')")
    ok('system theme follows OS (light then dark)', light and dark, f'{light},{dark}')
    # R6 storage quota during autosave
    pg.select_option('[data-key="autosave"]','1'); pg.click('#close-settings-modal-btn')
    box=pg.locator('canvas.upper-canvas').first.bounding_box()
    pg.click('#wall-tool-btn')
    for x,y in [(200,200),(500,200)]:
        pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(90)
    pg.click('#select-tool-btn')
    pg.evaluate("(()=>{try{let s='x'.repeat(1024*1024);for(let i=0;i<20;i++)localStorage.setItem('junk'+i,s);}catch(e){} })()")
    pg.evaluate("Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(400)
    tip=pg.inner_text('#tool-tip'); ok('quota: autosave failure reported, app alive', 'Autosave failed' in tip or pg.evaluate("!!localStorage.getItem('naqshcad-autosave')"), tip[:60])
    pg.evaluate("localStorage.clear()")
    # R7 invalid files and links
    dialogs=[]; pg.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
    open('/tmp/t/garbage.json','w').write('{not json')
    open('/tmp/t/weird.gncad','w').write(json.dumps({'canvasData':{'objects':[{'type':'polyline','points':'nope'}]},'meta':{'floors':[{'id':1,'json':'x','graph':{'version':1,'authoritative':True,'nodes':[{'x':'a','y':1}],'edges':[]}}]}}))
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.set_input_files('#settings-file-input','/tmp/t/garbage.json') if pg.locator('#settings-file-input').count() else None; pg.wait_for_timeout(300)
    pg.set_input_files('#compare-file-input','/tmp/t/garbage.json'); pg.wait_for_timeout(600)
    ok('invalid compare file handled', 'could not be read' in pg.inner_text('#compare-body') ); pg.click('#close-compare-modal-btn')
    pg.set_input_files('#file-input','/tmp/t/weird.gncad'); pg.wait_for_timeout(700)
    ok('malformed project does not crash the page', pg.evaluate("document.body.innerText.length>0"), str(errs)[:120])
    pg.goto('http://localhost:8765/index.html#p=gNotValid!!'); pg.wait_for_timeout(900)
    ok('broken share link reports error', any('could not be opened' in m for m in dialogs), str(dialogs)[-80:])
    ctx.close()
    # R8/R9 history across floors, fillet tiny radius + normalize
    ctx=b.new_context(viewport={'width':1280,'height':860}); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('F'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700); box=pg.locator('canvas.upper-canvas').first.bounding_box()
    def wall(pts):
        pg.click('#wall-tool-btn')
        for x,y in pts:
            pg.mouse.move(box['x']+x,box['y']+y); pg.mouse.click(box['x']+x,box['y']+y); pg.wait_for_timeout(80)
        pg.click('#select-tool-btn'); pg.wait_for_timeout(200)
    wall([(200,200),(500,200),(500,400),(200,400),(200,200)])
    pg.click('#fillet-tool-btn'); pg.fill('#fillet-radius','0.05'); pg.click('#fillet-apply-btn'); pg.mouse.click(box['x']+500,box['y']+200); pg.wait_for_timeout(300)
    pg.click('#select-tool-btn')
    pg.click('#graph-tool-btn'); pg.click('#graph-normalize-btn'); pg.wait_for_timeout(300); msg=pg.inner_text('#graph-message')
    sm=pg.inner_text('#graph-summary'); ok('tiny fillet + normalize keeps a closed room', 'Closed rooms found\n1' in sm or 'Closed rooms found | 1' in sm.replace('\n',' | '), sm.replace('\n',' | ')[:150])
    pg.click('#close-graph-modal-btn')
    pg.click('#add-floor-btn'); pg.wait_for_timeout(400); wall([(200,200),(400,200)])
    pg.click('#undo-btn'); pg.wait_for_timeout(300)
    h2=[e.text_content() for e in pg.locator('.history-item').all()]
    pg.click('.floor-item:first-child'); pg.wait_for_timeout(500)
    h1=[e.text_content() for e in pg.locator('.history-item').all()]
    ok('per-floor history stays separate', len(h1)>=3 and len(h2)==1, f'{len(h1)} vs {len(h2)}')
    pg.click('#settings-btn'); pg.select_option('[data-key="historyLimit"]','20'); pg.click('#close-settings-modal-btn')
    for i in range(30): 
        wall([(150+i*5,500),(250+i*5,520)])
    n=pg.locator('.history-item').count(); ok('history limit trims to 20', n<=20, str(n))
    ok('no page errors in risk run', not errs, str(errs)[:200]); ctx.close(); b.close()
print('SUMMARY', sum(1 for r in res if r[1]), '/', len(res))
