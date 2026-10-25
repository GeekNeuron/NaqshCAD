import json, time, sys
from playwright.sync_api import sync_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 60
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':860},accept_downloads=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('dialog',lambda d:d.accept('X'))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(700)
    data=pg.evaluate("""(N)=>{
      const sc=new fabric.StaticCanvas(null,{width:100,height:100});
      const mk=(pts)=>new fabric.Polyline(pts,{stroke:'#e8e8ea',strokeWidth:5,fill:null,objectCaching:false,data:{layer:'walls',type:'wall-system'}});
      for(let i=0;i<N;i++){ sc.add(mk([{x:0,y:i*40},{x:N*40,y:i*40}])); sc.add(mk([{x:i*40,y:0},{x:i*40,y:N*40}])); }
      for(let i=0;i<Math.min(N*5,400);i++){ sc.add(new fabric.Rect({left:(i%N)*40+10,top:Math.floor(i/N)*40+10,width:20,height:20,fill:'#888',data:{layer:'furniture',type:'furniture',name:'Sofa'}})); }
      return {canvasData: sc.toJSON(['data','name']), meta:{}};
    }""", N)
    json.dump(data,open('/tmp/t/big.gncad','w'))
    print('objects', len(data['canvasData']['objects']), 'size KB', len(json.dumps(data))//1024)
    t=time.time(); pg.set_input_files('#file-input','/tmp/t/big.gncad'); pg.wait_for_function("document.querySelectorAll('.history-item').length>=1 && document.querySelector('.history-item.current').textContent.includes('Open project')", timeout=120000); print('load s', round(time.time()-t,2))
    def timed(label, fn):
        t=time.time(); fn(); print(label, round(time.time()-t,2),'s')
    timed('graph modal', lambda: (pg.click('#graph-tool-btn'), pg.wait_for_selector('#graph-summary .graph-row'), pg.wait_for_timeout(50)))
    print(pg.inner_text('#graph-summary').replace('\n',' | ')[:160])
    pg.click('#close-graph-modal-btn')
    timed('report+checks', lambda: (pg.click('#file-menu-btn'), pg.click('#report-btn'), pg.wait_for_selector('.report-issue', timeout=120000)))
    pg.click('#close-report-modal-btn')
    def save():
        pg.click('#file-menu-btn')
        with pg.expect_download(timeout=120000) as d: pg.click('#save-btn')
        d.value.save_as('/tmp/t/big_saved.gncad')
    timed('save (graph)', save)
    timed('add floor', lambda: (pg.click('#add-floor-btn'), pg.wait_for_timeout(100)))
    timed('switch back', lambda: (pg.click('.floor-item:first-child'), pg.wait_for_timeout(100)))
    timed('3D preview', lambda: (pg.click('#file-menu-btn'), pg.click('#view3d-btn'), pg.wait_for_timeout(100)))
    pg.wait_for_timeout(500); pg.click('#close-view3d-modal-btn')
    timed('normalize', lambda: (pg.click('#graph-tool-btn'), pg.click('#graph-normalize-btn'), pg.wait_for_timeout(100)))
    print(pg.inner_text('#graph-message')[:80]); pg.click('#close-graph-modal-btn')
    print('errs',errs); b.close()
