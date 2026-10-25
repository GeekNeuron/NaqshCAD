from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True)
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html'); pg.wait_for_timeout(800)
    res=pg.evaluate("""() => {
      const el=document.querySelector('canvas.upper-canvas');
      const mk=(id,x,y)=>new Touch({identifier:id,target:el,clientX:x,clientY:y});
      const fire=(type,pts)=>el.dispatchEvent(new TouchEvent(type,{touches:pts,changedTouches:pts,targetTouches:pts,bubbles:true,cancelable:true}));
      const z0=document.querySelector('#status-bar').innerText.match(/Zoom: (\\d+)%/)[1];
      fire('touchstart',[mk(1,150,300),mk(2,250,300)]);
      fire('touchmove',[mk(1,100,300),mk(2,300,300)]);
      fire('touchmove',[mk(1,60,300),mk(2,340,300)]);
      fire('touchend',[]);
      return [z0, document.querySelector('#status-bar').innerText.match(/Zoom: (\\d+)%/)[1]];
    }""")
    print('zoom before/after pinch-out:',res,'errs',errs); b.close()
