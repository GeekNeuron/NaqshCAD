import json, time, sys, math
from playwright.sync_api import sync_playwright
M=int(sys.argv[1])
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':860},accept_downloads=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    data=pg.evaluate("""(M)=>{
      const sc=new fabric.StaticCanvas(null,{width:100,height:100});
      const pts=[]; for(let i=0;i<=M;i++){const a=i/M*Math.PI*2; pts.push({x:600+500*Math.cos(a)*(1+0.1*Math.sin(a*7)),y:600+400*Math.sin(a)});}
      sc.add(new fabric.Polyline(pts,{stroke:'#e8e8ea',strokeWidth:5,fill:null,objectCaching:false,data:{layer:'walls',type:'wall-system'}}));
      return {canvasData: sc.toJSON(['data','name']), meta:{}};
    }""", M)
    json.dump(data,open('/tmp/t/dense.gncad','w'))
    pg.set_input_files('#file-input','/tmp/t/dense.gncad'); pg.wait_for_timeout(1500)
    def timed(label, fn):
        t=time.time(); fn(); print(label, round(time.time()-t,2),'s')
    timed('graph modal', lambda: (pg.click('#graph-tool-btn'), pg.wait_for_selector('#graph-summary .graph-row', timeout=180000)))
    print(pg.inner_text('#graph-summary').replace('\n',' | ')[:140]); pg.click('#close-graph-modal-btn')
    def save():
        pg.click('#file-menu-btn')
        with pg.expect_download(timeout=180000) as d: pg.click('#save-btn')
        d.value.save_as('/tmp/t/dense_saved.gncad')
    timed('save', save)
    print('errs',errs); b.close()
