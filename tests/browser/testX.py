import json
from playwright.sync_api import sync_playwright
payload={'canvasData':{'objects':[],'background':''},'meta':{'customLayers':[{'id':'a"] , x[','name':'<img src=x onerror="window.__xss=1">Evil'},{'id':'ok-1','name':'Plain <b>name</b>'}]}}
json.dump(payload,open('/tmp/t/xss.gncad','w'))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(600)
    pg.set_input_files('#file-input','/tmp/t/xss.gncad'); pg.wait_for_timeout(900)
    print('xss flag:', pg.evaluate("window.__xss"), '| layer rows:', pg.evaluate("[...document.querySelectorAll('.custom-layer-item span:nth-child(2)')].map(e=>e.textContent)"), '| img injected:', pg.evaluate("document.querySelectorAll('.custom-layer-item img').length"))
    pg.click('.custom-layer-item .visibility-toggle >> nth=1'); pg.click('.custom-layer-item .remove-layer-btn >> nth=0'); pg.wait_for_timeout(300)
    print('after toggle/remove rows:', pg.evaluate("document.querySelectorAll('.custom-layer-item').length"), errs); b.close()
