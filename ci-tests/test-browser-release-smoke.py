#!/usr/bin/env python3
import contextlib, http.server, os, socketserver, threading, time, sys, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
    def end_headers(self):
        self.send_header("Cache-Control","no-store")
        super().end_headers()

@contextlib.contextmanager
def server():
    old=os.getcwd(); os.chdir(ROOT)
    httpd=socketserver.TCPServer(("127.0.0.1",0),QuietHandler)
    t=threading.Thread(target=httpd.serve_forever,daemon=True);t.start()
    try: yield f"http://127.0.0.1:{httpd.server_address[1]}"
    finally:
        httpd.shutdown();httpd.server_close();os.chdir(old)


@contextlib.contextmanager
def target_base():
    external=os.environ.get('BROWSER_BASE_URL','').strip().rstrip('/')
    if external:
        yield external
    else:
        with server() as base:
            yield base

def check(cond,msg):
    if not cond: raise AssertionError(msg)

def shown(page,sel):
    return page.locator(sel).evaluate("""el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;
    }""")

def top_owner(page,sel):
    return page.locator(sel).evaluate("""el=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+Math.min(r.height/2,180);
      const top=document.elementFromPoint(x,y);
      return !!top && (top===el || el.contains(top));
    }""")

def nav_visible(page):
    return page.locator('.app-nav').evaluate("""el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;
    }""")

def select_crystal(page):
    page.wait_for_selector('#mamaModal.show')
    page.locator('#mamaModal .family-choice[data-family="crystal"]').click()
    page.wait_for_function("!document.getElementById('mamaModal').classList.contains('show')")

def open_selector(page):
    page.locator('.friend-pill').click()
    page.wait_for_selector('#mamaModal.show')
    page.wait_for_selector('#tripStudioSelectorToggle')

def studio_login(page):
    open_selector(page)
    page.locator('#tripStudioSelectorToggle').click()
    page.wait_for_selector('#adminPinModal:not([hidden])')
    pin=page.evaluate("TRIP_CONFIG.admin.pin")
    page.locator('#adminPinInput').fill(str(pin))
    page.locator('#adminPinForm').evaluate("(f)=>f.requestSubmit()")
    page.wait_for_selector('#tripStudioModal.show')

def close_studio(page):
    page.locator('#tripStudioModal .trip-studio-close').click()
    page.wait_for_function("!document.getElementById('tripStudioModal').classList.contains('show')")

def assert_studio_foreground(page,stage):
    check(shown(page,'#tripStudioModal'),f'{stage}: Studio modal not visible')
    check(shown(page,'#adminModeControl'),f'{stage}: Studio card not visible')
    check(top_owner(page,'#adminModeControl'),f'{stage}: Studio card is not foreground hit-test owner')
    check(nav_visible(page),f'{stage}: bottom navigation disappeared')
    z=page.locator('#tripStudioModal').evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
    hero=page.locator('.home-hero, .hero, main').first
    if hero.count():
        hz=hero.evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
        check(z>hz,f'{stage}: Studio z-index {z} is not above page/hero {hz}')

def assert_studio_closed_clean(page,stage):
    check(not page.locator('#tripStudioModal').evaluate("el=>el.classList.contains('show')"),f'{stage}: Studio modal show class remains')
    check(page.locator('#tripStudioModal').get_attribute('aria-hidden')=='true',f'{stage}: Studio aria-hidden not restored')
    check(not shown(page,'#tripStudioModal'),f'{stage}: Studio overlay remains visible after Close')
    check(not shown(page,'#adminModeControl'),f'{stage}: ghost Studio card remains visible after Close')
    check(nav_visible(page),f'{stage}: bottom navigation missing after Studio Close')

def guide_to_booking(page,day,item_id):
    page.goto(f'{page.url.split("/")[0]}//{page.url.split("/")[2]}/day.html?day={day}',wait_until='domcontentloaded')
    page.wait_for_timeout(120)
    card=page.locator(f'#{item_id}')
    check(card.count()==1,f'Timeline card #{item_id} missing')
    guide=card.locator('.timeline-action--guide')
    booking=card.locator('.timeline-action--trip')
    check(guide.count()>0,f'{item_id}: Guide action missing')
    check(booking.count()>0,f'{item_id}: Booking action missing')

    # Direct Booking must own foreground.
    booking.click()
    page.wait_for_selector('#tripModal.show')
    check(top_owner(page,'#tripModal .trip-sheet'),f'{item_id}: direct Booking sheet is behind page/hero')
    check(nav_visible(page),f'{item_id}: nav disappeared while Booking open')
    page.locator('#tripModal .trip-close').click()
    page.wait_for_function("!document.getElementById('tripModal').classList.contains('show')")

    # Guide -> Booking stacking must preserve Guide underneath Booking.
    guide.click()
    page.wait_for_selector('#guideModal.show')
    check(top_owner(page,'#guideModal .guide-sheet'),f'{item_id}: Guide sheet is behind page/hero')
    check(nav_visible(page),f'{item_id}: nav disappeared while Guide open')
    b=page.locator('#guideModal button.utility-button',has_text='Booking')
    check(b.count()>0,f'{item_id}: Guide card has no linked Booking button')
    b.click()
    page.wait_for_selector('#tripModal.show')
    check(page.locator('#guideModal').evaluate("el=>el.classList.contains('show')"),f'{item_id}: Guide closed instead of stacking under Booking')
    gz=page.locator('#guideModal').evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
    tz=page.locator('#tripModal').evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
    check(tz>gz,f'{item_id}: Booking z-index {tz} must exceed Guide {gz}')
    check(top_owner(page,'#tripModal .trip-sheet'),f'{item_id}: Guide→Booking sheet is not foreground hit-test owner')
    page.locator('#tripModal .trip-close').click()
    page.wait_for_function("!document.getElementById('tripModal').classList.contains('show')")
    check(page.locator('#guideModal').evaluate("el=>el.classList.contains('show')"),f'{item_id}: closing Booking did not return to Guide')
    check(top_owner(page,'#guideModal .guide-sheet'),f'{item_id}: Guide did not regain foreground after Booking close')
    page.locator('#guideModal .guide-close').click()

def run_viewport(browser,base,viewport,label):
      context=browser.new_context(viewport=viewport)
      page=context.new_page()
      errors=[]
      page.on('pageerror',lambda e: errors.append(str(e)))
      try:
        page.goto(base+'/index.html',wait_until='domcontentloaded')
        page.evaluate("document.getElementById('ccmvSplash')?.remove()")
        select_crystal(page)
        runtime_version=page.evaluate("TRIP_CONFIG.version")
        m=re.match(r'^RC([0-9.]+)-(.+)$',str(runtime_version or ''))
        check(bool(m),f'{label}: Runtime version malformed: {runtime_version}')
        expected_build=f'VN-RC{m.group(1)}|{m.group(2)}'
        actual_build=page.locator('meta[name="travel-engine-build"]').get_attribute('content')
        check(actual_build==expected_build,f'{label}: Build identity mismatch: {actual_build} != {expected_build}')

        studio_login(page)
        assert_studio_foreground(page,label+' PIN open')
        close_studio(page)
        assert_studio_closed_clean(page,label+' first Close')

        # Active Studio session: User Selector is direct Studio re-entry.
        page.locator('.friend-pill').click()
        page.wait_for_selector('#tripStudioModal.show')
        check(not page.locator('#mamaModal').evaluate("el=>el.classList.contains('show')"),
              label+': active User Selector incorrectly opened traveller selector')
        assert_studio_foreground(page,label+' active User Selector reopen')
        close_studio(page)
        assert_studio_closed_clean(page,label+' second Close')

        page.reload(wait_until='domcontentloaded')
        page.evaluate("document.getElementById('ccmvSplash')?.remove()")
        page.wait_for_timeout(100)
        assert_studio_closed_clean(page,label+' reload')
        page.locator('.friend-pill').click()
        page.wait_for_selector('#tripStudioModal.show')
        check(not page.locator('#mamaModal').evaluate("el=>el.classList.contains('show')"),
              label+': reload active User Selector incorrectly opened traveller selector')
        assert_studio_foreground(page,label+' reload active re-entry')
        close_studio(page)
        page.evaluate("window.exitTripStudioMode && window.exitTripStudioMode()")
        page.wait_for_timeout(50)

        # Timeline → direct Booking.
        page.goto(base+'/day.html?day=2',wait_until='domcontentloaded')
        page.wait_for_timeout(120)
        card=page.locator('#pizza4ps')
        check(card.count()==1,label+': D2 Pizza 4P’s timeline card missing')
        booking=card.locator('.timeline-action--trip')
        guide=card.locator('.timeline-action--guide')
        check(booking.count()>0 and guide.count()>0,label+': D2 Pizza must expose Guide and Booking')
        booking.click(); page.wait_for_selector('#tripModal.show')
        check(top_owner(page,'#tripModal .trip-sheet'),label+': Direct Booking sheet is behind page/hero')
        check(nav_visible(page),label+': bottom nav disappeared during direct Booking')
        page.locator('#tripModal .trip-close').click()

        # Timeline → Guide → Booking → Close Booking MUST return directly to Timeline.
        guide.click(); page.wait_for_selector('#guideModal.show')
        check(top_owner(page,'#guideModal .guide-sheet'),label+': Guide sheet is behind page/hero')
        check(page.evaluate("window.GUIDE_MODAL_ORIGIN")=='timeline',label+': Guide origin was not recorded as timeline')
        linked=page.locator('#guideModal button.utility-button',has_text='Booking')
        check(linked.count()>0,label+': Guide linked Booking button missing')
        linked.click(); page.wait_for_selector('#tripModal.show')
        check(page.locator('#guideModal').evaluate("el=>el.classList.contains('show')"),label+': Guide must remain stacked while Booking is open')
        gz=page.locator('#guideModal').evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
        tz=page.locator('#tripModal').evaluate("el=>Number(getComputedStyle(el).zIndex)||0")
        check(tz>gz,f'{label}: Guide→Booking stacking wrong: Trip {tz}, Guide {gz}')
        check(top_owner(page,'#tripModal .trip-sheet'),label+': Guide→Booking sheet is not foreground owner')
        page.locator('#tripModal .trip-close').click()
        page.wait_for_function("!document.getElementById('tripModal').classList.contains('show')")
        check(not page.locator('#guideModal').evaluate("el=>el.classList.contains('show')"),label+': Timeline-origin Guide remained open after Booking Close')
        check(page.locator('#pizza4ps').count()==1,label+': Timeline context was not retained')
        check(page.evaluate("window.GUIDE_MODAL_ORIGIN") is None,label+': Timeline Guide origin was not cleared')
        check(nav_visible(page),label+': bottom nav missing after Timeline return')

        # Change Effect Gate: poison persisted booking state with pre-reconciliation values,
        # reload, then assert the actual rendered Booking UI still reflects current deploy master.
        page.evaluate("""() => {
          const stale={
            'bk-pizza4ps':{id:'bk-pizza4ps',bookingId:'bk-pizza4ps',title:'Pizza 4P’s Hai Bà Trưng',day:4,dayId:'day4',date:'2026-11-02',time:'11:30',status:'pending',notes:'Reserve lunch for 4 guests.'},
            'bk-moc-huong':{id:'bk-moc-huong',bookingId:'bk-moc-huong',title:'Mộc Hương Wellness',day:3,dayId:'day3',date:'2026-11-01',time:'15:30',status:'pending'},
            'bk-moc-healing':{id:'bk-moc-healing',bookingId:'bk-moc-healing',title:'Mộc Healing Spa',day:4,dayId:'day4',date:'2026-11-02',time:'16:45',status:'pending'}
          };
          STORAGE.local.writeJSON(BOOKING_AUTHORITY.key,{version:1,overrides:stale,deletedIds:[],updatedAt:'2026-08-01T00:00:00Z'});
        }""")
        page.reload(wait_until='domcontentloaded')
        page.evaluate("document.getElementById('ccmvSplash')?.remove()")
        page.evaluate("openBookingCategoryCard('Restaurants')")
        page.wait_for_selector('#tripModal.show')
        restaurant_text=page.locator('#tripModalContent').inner_text()
        check('Pizza 4P’s Bến Thành' in restaurant_text,label+': rendered Restaurants rolled back Pizza branch')
        check('13:00' in restaurant_text,label+': rendered Restaurants rolled back Pizza time')
        check('Hai Bà Trưng' not in restaurant_text,label+': stale Pizza title survived into rendered UI')
        check('11:30' not in restaurant_text,label+': stale Pizza time survived into rendered UI')

        # Open Pizza detail and prove "Online" produces a real clickable booking action.
        page.locator("#tripModalContent button, #tripModalContent .booking-picker-row").filter(has_text="Pizza 4P’s Bến Thành").first.click()
        page.wait_for_timeout(50)
        check(page.locator('#tripModalContent a.trip-action-btn--book',has_text='Book Online').count()>0,
              label+': Pizza says online but rendered no Book Online action')
        check('tablecheck.com' in (page.locator('#tripModalContent a.trip-action-btn--book').first.get_attribute('href') or ''),
              label+': Pizza Book Online does not point to reservation URL')
        page.locator('#tripModal .trip-close').click()

        page.evaluate("openBookingCategoryCard('Spa')")
        page.wait_for_selector('#tripModal.show')
        spa_text=page.locator('#tripModalContent').inner_text()
        check('Mộc Hương Wellness' not in spa_text,label+': obsolete D4 Mộc Hương booking resurrected from stale state')
        check('Mộc Healing Spa' in spa_text and '14:20' in spa_text,label+': Mộc Healing did not render at 14:20')
        check('16:45' not in spa_text,label+': stale Mộc Healing time survived into rendered UI')

        # Mộc Healing: website/email yes; no invented WhatsApp/phone action.
        page.locator("#tripModalContent button, #tripModalContent .booking-picker-row").filter(has_text="Mộc Healing Spa").first.click()
        page.wait_for_timeout(50)
        check(page.locator('#tripModalContent a.trip-action-btn--book',has_text='Book Online').count()>0,
              label+': Mộc Healing website action missing')
        check(page.locator('#tripModalContent a.trip-action-btn--email',has_text='Email').count()>0,
              label+': Mộc Healing email action missing')
        check(page.locator('#tripModalContent a.trip-action-btn--whatsapp').count()==0,
              label+': Mộc Healing incorrectly exposes WhatsApp')
        check(page.locator('#tripModalContent a.trip-action-btn--call').count()==0,
              label+': phone-only Call action should not exist')
        page.locator('#tripModal .trip-close').click()

        check(not errors,label+': Browser page errors: '+' | '.join(errors))
        print(f'BROWSER VIEWPORT {label}: PASS')
      finally:
        context.close()

def run():
  with target_base() as base, sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome') or None,args=['--no-sandbox'])
    try:
      run_viewport(browser,base,{'width':1280,'height':800},'desktop-1280x800')
      run_viewport(browser,base,{'width':390,'height':844},'mobile-390x844')
      print('BROWSER INTERACTION SMOKE: PASS — desktop + mobile Studio lifecycle and Timeline → Guide → Booking return contract.')
    finally:
      browser.close()

if __name__=='__main__':
  try: run()
  except Exception as e:
    print('BROWSER INTERACTION SMOKE: FAIL —',e,file=sys.stderr)
    raise
