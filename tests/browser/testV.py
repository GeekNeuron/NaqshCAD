from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':360,'height':640},has_touch=True,is_mobile=True,device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(800)
    def m(): return pg.evaluate("""(()=>{const a=document.getElementById('app-container').getBoundingClientRect();const t=document.getElementById('left-toolbar').getBoundingClientRect();const s=document.getElementById('status-bar').getBoundingClientRect();return {inner:window.innerHeight,app:Math.round(a.height),toolbarBottom:Math.round(t.bottom),statusBottom:Math.round(s.bottom),cssVar:getComputedStyle(document.documentElement).getPropertyValue('--app-height')}})()""")
    print('portrait', m())
    pg.evaluate("Object.defineProperty(window.visualViewport,'height',{get:()=>560,configurable:true}); window.visualViewport.dispatchEvent(new Event('resize'))"); pg.wait_for_timeout(500)
    r=m(); print('after browser bar grows (visualViewport 560):', r, 'canvas h', pg.evaluate("document.querySelector('canvas.lower-canvas').height/ (window.devicePixelRatio||1)"))
    pg.screenshot(path='/tmp/t/V_short.png')
    print(errs); b.close()
