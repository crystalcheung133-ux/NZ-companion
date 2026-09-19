#!/usr/bin/env python3
import contextlib,http.server,os,socketserver,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
 def end_headers(self): self.send_header("Cache-Control","no-store");super().end_headers()
@contextlib.contextmanager
def server():
 old=os.getcwd();os.chdir(ROOT);s=socketserver.TCPServer(("127.0.0.1",0),H);threading.Thread(target=s.serve_forever,daemon=True).start()
 try: yield f"http://127.0.0.1:{s.server_address[1]}"
 finally:s.shutdown();s.server_close();os.chdir(old)
def ck(x,m):
 if not x: raise AssertionError(m)

def identity(p):
 p.wait_for_function("typeof window.setFriend==='function'")
 p.evaluate("()=>window.setFriend('lee')")
 p.wait_for_function("()=>{const m=document.getElementById('mamaModal');return !m||!m.classList.contains('show')}")

def vis(p,s):
 return p.locator(s).evaluate("el=>{const x=getComputedStyle(el),r=el.getBoundingClientRect();return x.display!='none'&&x.visibility!='hidden'&&r.width>0&&r.height>0}")

def check_docs_first_click(browser,base,path,label):
 c=browser.new_context(viewport={"width":390,"height":844});p=c.new_page()
 p.goto(base+"/"+path,wait_until="domcontentloaded");identity(p);p.evaluate("document.getElementById('ccmvSplash')?.remove()")
 a=p.locator('.app-nav .docs-nav-trigger');ck(a.count()==1,label+": Docs nav missing");ck(a.get_attribute("href")=="documents.html",label+": Docs href wrong")
 a.click();p.wait_for_url("**/documents.html");ck(p.url.endswith("/documents.html"),label+": first Docs click did not open Documents");c.close()

def run(browser,base,v,label):
 c=browser.new_context(viewport=v);p=c.new_page();errs=[];p.on("pageerror",lambda e:errs.append(str(e)))
 p.goto(base+"/documents.html",wait_until="domcontentloaded");identity(p);p.evaluate("document.getElementById('ccmvSplash')?.remove()");p.wait_for_timeout(150)
 a=p.locator('.app-nav a.docs-nav-trigger');ck(a.count()==1,label+": direct Docs link missing");ck(a.get_attribute("href")=="documents.html",label+": wrong href")
 ck(not errs,label+": JS error on Documents load: "+" | ".join(errs));ck(vis(p,'.documents-hero'),label+": hero hidden");ck(vis(p,'.app-nav'),label+": nav hidden")
 ck(not vis(p,'#docModal'),label+": Add form visible initially");ck(not vis(p,'#docViewer'),label+": viewer visible initially");ck(p.locator('#globalDocsModal').count()==0,label+": legacy overlay exists")
 p.get_by_role("button",name="＋ Upload document").click();ck(vis(p,'#docModal'),label+": Upload failed")
 save=p.locator('#docSave');r=save.bounding_box();ck(r and r["y"]<v["height"] and r["y"]+r["height"]>0,label+": Save out of viewport")
 p.locator('#docModal .docs-close').click();ck(not vis(p,'#docModal'),label+": Upload close failed")
 # Verify reverse attachment lookup uses canonical Rental Car booking id.
 first_doc=p.locator(".document-title-open").first;doc_id=first_doc.get_attribute("onclick").split("'")[1]
 p.evaluate("(id)=>TRIP_DOCUMENTS.update(id,{linkType:'booking',linkId:'car-rental',linkLabel:'Rental Cars 247'})",doc_id)
 p.goto(base+"/index.html?bookingId=car-rental",wait_until="domcontentloaded");identity(p);p.wait_for_selector("#tripModal.show")
 ck(p.locator("#tripModalContent .booking-document-links a").count()>0,label+": Rental Car linked attachment missing")
 txt=p.locator("#tripModalContent").inner_text()
 ck("NZD 628.82" in txt and "NZD 13.95" in txt and "NZD 614.87" in txt,label+": Rental Car NZD pricing missing")

 p.goto(base+"/documents.html",wait_until="domcontentloaded");identity(p);p.wait_for_timeout(80)
 edit=p.locator("button[onclick^=\"openEditDocument\"]").first;ck(edit.count()>0,label+": Edit action missing");edit.click();ck(vis(p,'#editDocModal'),label+": Edit modal failed");p.get_by_role("button",name="Save Changes").click();ck(not vis(p,'#editDocModal'),label+": Edit modal did not close")
 op=p.locator(".document-title-open").first;ck(op.count()>0,label+": clickable document title missing");op.click();p.wait_for_timeout(150)
 ck(vis(p,'#docViewer'),label+": viewer failed");ck(p.locator('#docViewerTitle').inner_text().strip(),label+": blank viewer title")
 head=p.locator('#docViewer .doc-viewer-head').bounding_box();close=p.locator('#docViewer .doc-viewer-close').bounding_box();ck(head and close and close["x"]>head["x"]+head["width"]/2,label+": viewer Close is not on the right")
 p.locator('#docViewer .doc-viewer-close').click();ck(not vis(p,'#docViewer'),label+": viewer close failed")
 p.reload(wait_until="domcontentloaded");p.wait_for_timeout(100);ck(not vis(p,'#docModal') and not vis(p,'#docViewer'),label+": modal/viewer reopened after reload")
 ck(not errs,label+": page errors: "+" | ".join(errs));c.close()
available=0
with server() as base:
 with sync_playwright() as pw:
  for engine in ("chromium","webkit"):
   try:b=getattr(pw,engine).launch(headless=True)
   except Exception as e:
    print(f"DOCUMENTS BROWSER GATE {engine.upper()}: BLOCKED — {str(e).splitlines()[0]}");continue
   available+=1
   for path,label in [('trip.html','Trip'),('day.html?day=3','Day'),('moments.html','Moments'),('expenses.html','Expenses')]:check_docs_first_click(b,base,path,label)
   for v in ({"width":390,"height":844},{"width":430,"height":932}):run(b,base,v,f"{engine} {v['width']}x{v['height']}")
   b.close();print(f"DOCUMENTS BROWSER GATE {engine.upper()}: PASS")

if available==0:
 print("DOCUMENTS BROWSER GATE: BLOCKED — no supported browser binary available")
 raise SystemExit(2)
