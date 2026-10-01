# Regenerates the two review PDFs in this folder.  Run:  python docs/make_docs.py
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).parent
DATE = '1 October 2026'

# Arial has the Naira sign; the built-in Helvetica does not.
FONTS = 'C:/Windows/Fonts/'
pdfmetrics.registerFont(TTFont('Arial', FONTS + 'arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', FONTS + 'arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic', FONTS + 'ariali.ttf'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-Bold')

GREEN = colors.HexColor('#0d631b')
ORANGE = colors.HexColor('#a83900')
TINT = colors.HexColor('#e8f5e9')
AMBER = colors.HexColor('#fff4d6')
GRID = colors.HexColor('#c9d3c6')
GREY = colors.HexColor('#444444')

S = {
    'title': ParagraphStyle('title', fontName='Arial-Bold', fontSize=30, leading=36, textColor=GREEN, spaceAfter=8),
    'subtitle': ParagraphStyle('subtitle', fontName='Arial-Bold', fontSize=14, leading=18, textColor=ORANGE, spaceAfter=4),
    'intro': ParagraphStyle('intro', fontName='Arial', fontSize=12, leading=17, textColor=GREY, spaceAfter=10),
    'h1': ParagraphStyle('h1', fontName='Arial-Bold', fontSize=19, leading=24, textColor=GREEN, spaceBefore=10, spaceAfter=8),
    'h2': ParagraphStyle('h2', fontName='Arial-Bold', fontSize=13, leading=17, textColor=ORANGE, spaceBefore=8, spaceAfter=5),
    'body': ParagraphStyle('body', fontName='Arial', fontSize=10, leading=14.5, spaceAfter=5, alignment=TA_LEFT),
    'cell': ParagraphStyle('cell', fontName='Arial', fontSize=8.8, leading=11.5),
    'cellb': ParagraphStyle('cellb', fontName='Arial-Bold', fontSize=8.8, leading=11.5),
    'head': ParagraphStyle('head', fontName='Arial-Bold', fontSize=9, leading=11.5, textColor=colors.white),
    'note': ParagraphStyle('note', fontName='Arial', fontSize=9.5, leading=13.5, textColor=GREY),
}

W = A4[0] - 40 * mm  # usable width


def P(text, style='body'):
    return Paragraph(text, S[style])


def bullets(items):
    return ListFlowable([ListItem(P(t), leftIndent=12) for t in items], bulletType='bullet', start='•', leftIndent=12, bulletFontName='Arial', bulletFontSize=9)


def steps(items):
    return ListFlowable([ListItem(P(t), leftIndent=14) for t in items], bulletType='1', leftIndent=14, bulletFontName='Arial', bulletFontSize=9)


def table(header, rows, widths, bold_first=True):
    data = [[P(h, 'head') for h in header]]
    for r in rows:
        data.append([P(c, 'cellb' if (i == 0 and bold_first) else 'cell') for i, c in enumerate(r)])
    t = Table(data, colWidths=[w * W for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN),
        ('GRID', (0, 0), (-1, -1), 0.5, GRID),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def box(text, bg=TINT):
    t = Table([[P(text, 'note')]], colWidths=[W])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9), ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    return t


def gap(h=6):
    return Spacer(1, h)


def build(filename, footer, story):
    def decorate(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(GREEN)
        canvas.rect(0, A4[1] - 11 * mm, A4[0], 11 * mm, stroke=0, fill=1)
        canvas.setFont('Arial', 8)
        canvas.setFillColor(GREY)
        canvas.drawString(20 * mm, 12 * mm, footer)
        canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f'Page {doc.page}')
        canvas.restoreState()

    # Keep each heading on the same page as the block after it.
    glued, i = [], 0
    while i < len(story):
        item = story[i]
        if isinstance(item, Paragraph) and item.style.name in ('h1', 'h2') and i + 1 < len(story):
            nxt = [item, story[i + 1]]
            if isinstance(story[i + 1], Paragraph) and story[i + 1].style.name in ('h2', 'body') and i + 2 < len(story):
                nxt.append(story[i + 2])
                i += 1
            glued.append(KeepTogether(nxt))
            i += 2
        else:
            glued.append(item)
            i += 1
    story = glued

    doc = SimpleDocTemplate(str(OUT / filename), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=22 * mm, bottomMargin=22 * mm, title=footer, author='BuildLinka')
    doc.build(story, onFirstPage=decorate, onLaterPages=decorate)


# ─────────────────────────────── Document 1: Features by profile ───────────────────────────────

def features():
    s = [
        P('BuildLinka', 'title'),
        P('Features by profile and how the app works', 'subtitle'),
        P(f'Covers the four profiles: Vendor, Worker, Engineer and Buyer, plus the shared screens. Written for review of the app as it is in the code today (Expo SDK 57, version 1.0.0, {DATE}, branch <i>modernize-screens</i>).', 'intro'),
        box('<b>Important:</b> the app is still a <b>working design prototype</b>. Every screen opens and most buttons now do something, but all names, products, orders, earnings and projects are sample data built into the app. Nothing is sent to a server, nothing is saved after the app closes, and no real money moves. The calculators use real formulas, and the camera, barcode scanner and GPS are real. Section 7 lists exactly what is real and what is demo; section 8 lists what is still broken.'),
        P('1. How the app works (the journey)', 'h1'),
        steps([
            '<b>Welcome slides.</b> On first open the user sees swipeable intro slides and can tap <i>Skip</i> or <i>Get Started</i>.',
            '<b>"Who are you?"</b> The user chooses Vendor, Worker, Engineer or Buyer and taps <i>Continue</i>, or goes straight to the main app.',
            '<b>Profile dashboard.</b> Each profile opens its own dashboard with its own tools (sections 2 to 5).',
            '<b>Main app (5 tabs):</b> Home, Materials, Cart, Workers (titled "Professionals") and Profile, shared by everyone.',
        ]),
        P('Shared tabs and screens', 'h2'),
        table(['Screen', 'What the user can do'], [
            ['Home', 'Location bar, notifications bell, greeting, a search bar with <b>Scan</b> and <b>Photo</b> shortcuts, promo card, material categories (8 shown, tap to see all 12), featured banners, today&#39;s best deals, popular vendors, workers near you.'],
            ['Search (new)', 'Opens from Home. Live results while typing, grouped into categories, materials (with quick add to cart) and professionals. Recent searches, popular searches and a category grid. <b>Barcode / QR scanner</b> with flashlight: a match opens the product. <b>Search by photo</b>: take or pick a photo (matching needs a server, see section 7). "See all" opens Materials with the search filled in.'],
            ['Materials', 'Search, <b>Category</b> and <b>Sort</b> dropdowns, "In stock" toggle, Clear, grid or list view. In grid view the Add button turns into a quantity stepper once an item is in the cart.'],
            ['Cart', 'Items added from any product page or calculator, quantities, order summary, go to checkout.'],
            ['Workers ("Professionals")', 'Search by name, skill or area. <b>Trade</b> dropdown with counts, <b>Sort</b> dropdown (Recommended, Top rated, Lowest rate, Most jobs, Most experienced), "Available now" and "Near me" (GPS asked only when tapped). Tapping a worker opens a profile sheet with skills and stats and a hire request with number of days and estimated cost.'],
            ['Profile', 'User card and stats, referral card, recent activity, orders, listings, reviews, settings, logout.'],
        ], [0.22, 0.78]),
        P('Material category screens (all 11 rebuilt)', 'h2'),
        P('Every category screen now has a green header banner, a <b>calculator built on standard building formulas</b>, buying tips, the products in that category, a vendor card and a "hire" banner that opens Professionals. Where a matching product exists, the calculator result can be added to the cart in one tap.'),
        table(['Category', 'Calculator', 'Add result to cart'], [
            ['Cement', 'Slab (1:2:4 or 1:1.5:3), screed or plaster → bags of cement, tonnes of sand and granite. Brand comparison with "Lowest price".', 'Yes'],
            ['Steel & Iron', 'Bar size guide (8 to 25 mm). Rebar for slab mesh, columns and beams, or a plain weight check → rods, kg and binding wire.', 'Yes (12 mm rod)'],
            ['Roofing', 'Roof type, shape, pitch, overhang and waste → sheets, true roof area, ridge caps, screws. Comparison of roof types.', 'Yes (aluminium)'],
            ['Blocks', 'Wall length and height minus doors and windows → number of blocks.', 'Yes (9 inch)'],
            ['Tiles', 'Floor or wall, tile size, straight or diagonal → m² to order, tile count, adhesive bags.', 'Yes (60 × 60)'],
            ['Paint', 'Room size, doors, windows, coats, ceiling, number of rooms → litres, 20 L buckets or 4 L tins.', 'Yes (emulsion)'],
            ['Plumbing', 'Pipe run → number of pipe lengths and fittings. Water tank size for a household.', 'Yes (pipes)'],
            ['Electrical', 'Appliance list → total load, inverter/generator size, main cable size, battery for backup hours.', 'No product yet'],
            ['Glass', 'Pane size, count and thickness → area and weight, with safety-glass warnings.', 'No product yet'],
            ['Timber', 'Timber list in market sizes (2×4, 2×6, 1×12…) → pieces and cubic metres.', 'No product yet'],
            ['Equipment', 'Rental planner: day rate vs week rate → cheapest way to book and money saved.', 'No product yet'],
        ], [0.17, 0.63, 0.20]),
        P('Each product has a detail page with photos, vendor, rating, price, delivery, quantity selector, reviews, shipping information and "You may also like".'),

        P('2. Vendor profile', 'h1'),
        P('<b>Who:</b> shops and suppliers who sell building materials. <b>Goal:</b> list products, manage stock and track sales.'),
        P('Vendor dashboard', 'h2'),
        bullets([
            'Store header with the store name, notifications bell and an <b>Open / Closed</b> switch for the shop.',
            'Key numbers: <b>Total sales</b>, <b>Orders</b>, <b>Profile views</b>, <b>Rating</b>.',
            '<b>Critical stock alerts</b> for products running low, each with a <i>Restock</i> button.',
            '<b>Sales trend</b> chart, <b>recent orders</b> with status (Pending, Shipped, Delivered), and quick actions: Add listing, Inventory (My Store), Analytics, Settings.',
        ]),
        P('Vendor tools', 'h2'),
        table(['Screen', 'Features'], [
            ['Add Listing (rebuilt)', 'One scrolling page instead of four steps. Photos from camera or gallery (up to 6, asks permission first, tap a photo to make it the cover). Title with character count, category chips, description. Price in ₦ with automatic commas, unit chips (bag, piece, sheet…), stock quantity stepper. "You receive per unit" after the 10% service fee. A progress bar and a "3 left" counter; the Publish button stays above the keyboard and lists what is missing.'],
            ['My Store (rebuilt)', 'Listings / Inventory toggle with a red badge for low stock. Stat cards, search, filter chips with counts. Listings: Publish (drafts), Mark sold, Delete. Inventory: In stock / Low stock / Out of stock pills, stock bar, quantity stepper, Restock sheet with quick +10 / +25 / +50 / +100, Add-to-stock sheet with category chips, product list and live margin.'],
            ['Settings (vendor section)', 'Opens with a <b>Store</b> section only for vendors: "Accepting orders" switch, My Store, Sales & Analytics, "Low-stock alerts" switch.'],
            ['Saved Locations (rebuilt)', 'Real GPS: shows "You are here" with street and area; the user <b>names the place</b> and picks a type (Home, Work, Site, Other) before saving. Shows distance to each saved place, Directions in Google or Apple Maps, edit / rename, delete, and "Add address manually" with a "Use my current location" button.'],
            ['My Inventory, Sales Analytics, Orders', 'Unchanged: stock list and value; sales by month and week, best sellers, busiest times; orders with status filters.'],
        ], [0.24, 0.76]),
        P('How it works for a vendor', 'h2'),
        steps([
            'Choose <i>Vendor</i> on the "Who are you?" screen.',
            'Tap <i>Add listing</i>, add photos, details, price and stock, then <i>Publish listing</i>.',
            'Buyers find the product through Home, Search, Materials or a category calculator, and order it.',
            'The vendor watches orders and stock alerts, restocks in My Store, and pauses the shop in Settings when needed.',
        ]),

        P('3. Worker profile', 'h1'),
        P('<b>Who:</b> masons, electricians, plumbers, painters, tilers, carpenters and other trades. <b>Goal:</b> get hired, manage jobs and track earnings.'),
        P('Worker dashboard', 'h2'),
        bullets([
            'Profile header with name, trade and <b>daily rate</b>, and an <b>availability switch</b>.',
            'Overview numbers, skills, <b>earnings</b> (this week, this month, last month) and <b>upcoming jobs</b>.',
            'Quick actions: Create work, <b>Find jobs</b> (now opens straight on the Jobs list), Profile, Reviews, Team, Settings.',
        ]),
        P('Worker tools', 'h2'),
        table(['Screen', 'Features'], [
            ['Create Work (rebuilt)', 'One scrolling page. Trade chips, skill chips (several allowed, count shown), daily rate in ₦ with commas, phone number (checked for at least 10 digits), work area, short "about" text with counter, availability switch. The keyboard "next" key moves between fields and the Publish bar stays above the keyboard. <b>The keyboard no longer covers the form</b>.'],
            ['Find Jobs / Nearby (rebuilt)', 'Workers / Jobs toggle with counts, search, <b>Trade</b> and <b>Sort</b> dropdowns. Job cards show distance, "Urgent", duration, budget and an <b>Apply</b> button that turns into "Applied" (tap again to withdraw). Worker cards have a working <b>Hire</b> button.'],
            ['Edit Profile, My Reviews', 'Photo, name, email, phone, location, bio; reviews and ratings from clients.'],
        ], [0.24, 0.76]),
        P('How it works for a worker', 'h2'),
        steps([
            'Choose <i>Worker</i> and open the dashboard.',
            'Tap <i>Create work</i> to publish trade, skills and daily rate.',
            'Keep availability on; buyers find the worker in Professionals or Find Nearby.',
            'Use <i>Find jobs</i> to filter by trade and apply for nearby jobs.',
        ]),
        gap(4),
        P('4. Engineer profile (rebuilt)', 'h1'),
        P('<b>Who:</b> registered engineers who supervise building projects. <b>Goal:</b> oversee projects, budgets, teams, site visits and technical documents. All engineer screens now share the same data, so a change on one screen shows on the others while the app is open.'),
        P('Engineer dashboard', 'h2'),
        bullets([
            'Profile card with name, title, location, rating and a <b>COREN</b> pill; notifications bell with unread count.',
            '<b>Live numbers</b> worked out from the data: active projects, % of budget spent, specs waiting for review, site visits this week.',
            '<b>Needs attention</b>: projects at risk, delayed, or spending faster than they progress (for example "Spent 85% of budget at 60% progress").',
            '<b>Upcoming site visits</b>: tick to mark done, or <i>+ Schedule</i> (project, purpose, day and time).',
            'Active projects and quick actions: New project, Team, Specs, Settings.',
        ]),
        P('Engineer tools', 'h2'),
        table(['Screen', 'Features'], [
            ['My Projects', 'Total budget, spent and project count; search; <b>status dropdown</b> (On track, At risk, Delayed, Completed) with counts; New project (name, client, location, budget, deadline).'],
            ['Project detail (new)', 'Change status; update progress with −10 / −5 / +5 / +10 (asks to complete at 100%); budget card with <b>Log expense</b> and an overspending warning; site visits (schedule, tick, remove); crew (assign people, call them); the project\'s specifications with <i>+ Add</i>.'],
            ['Specifications', 'Search, status filter, project filter. Detail sheet with approval steps: <b>Submit for review → Approve</b> or <b>Send back to draft</b>, and <b>Reopen</b>. Add a new spec as a draft.'],
            ['Team', 'Totals (on site, idle, unassigned), search, status filter. <b>Call, Text and Email</b> buttons open the phone apps. Sheet to change status and assigned project.'],
        ], [0.22, 0.78]),

        P('5. Buyer profile', 'h1'),
        P('<b>Who:</b> home owners, developers and contractors. <b>Goal:</b> buy materials, hire workers and plan building projects.'),
        P('Buyer dashboard', 'h2'),
        bullets([
            'Welcome header with notifications bell and cart button with item count; summary numbers.',
            '<b>Shop by category</b> is now a dropdown: pick a category to open its page and calculator (the "Steel & Iron" link was broken and is fixed).',
            'Recommended products, recent orders and quick actions: Build, Cart, Hire, Orders.',
        ]),
        P('Buyer tools', 'h2'),
        table(['Screen', 'Features'], [
            ['Build Project', 'Project planner with templates (3-bedroom bungalow, duplex, shop/office): basics, timeline and budget level, cost breakdown, materials and workers needed, payment plan, and an "AI Building Assistant" chat (scripted, see section 7).'],
            ['Calculators', 'The 11 category calculators (section 1) turn sizes into quantities and add them to the cart.'],
            ['Checkout (rebuilt)', 'One page: items with "Edit cart"; delivery method cards (Standard, Express, <b>Pickup station</b> which hides the address); address with <b>"Use my current location"</b>; phone; payment method (Card, Bank transfer, Paystack) with what happens next; totals. Missing fields turn red. Success screen with order number, delivery time and "Track my order". An empty cart shows a message instead of a checkout. <b>Typing no longer closes the keyboard after each letter.</b>'],
            ['Hire workers', 'Professionals tab hire sheet (days and cost), and the Workers marketplace hire form (start date, days, description, total).'],
            ['Orders / History', 'Current orders with status; history filtered by All, Delivered, Cancelled, Returned.'],
            ['Saved', 'Wishlist products and saved locations (real GPS, see section 2).'],
        ], [0.2, 0.8]),
        P('How it works for a buyer', 'h2'),
        steps([
            'Choose <i>Buyer</i> (or skip and use the main tabs).',
            'Find materials with Search, Scan, Materials or a category; use the calculator to get the right quantity.',
            'Add to cart and check out with delivery or pickup.',
            'Hire a worker from Professionals, then follow orders from the dashboard.',
        ]),
        gap(4),
        P('6. Other screens (all users)', 'h1'),
        table(['Screen', 'Features'], [
            ['Notifications', 'Alerts with unread count shown on every dashboard bell.'],
            ['Settings (rebuilt)', 'Profile card with Edit; Account (saved locations, privacy & security, hide profile); Preferences (notifications, language); Support (help center, contact, about). <b>Log out</b> now asks to confirm. Version number read from the app. Hidden admin entry: triple-tap the version text at the bottom, then a 4-digit PIN.'],
            ['Admin Panel', 'Platform overview, user lists, push notification composer, featured banners, reports, export, settings.'],
            ['Delivery Dashboard', 'Logistics screen with deliveries and alerts. Still built but not linked from anywhere.'],
            ['Help Center / Privacy', 'Help topics and privacy & security options.'],
        ], [0.22, 0.78]),

        P('7. What is real and what is demo today', 'h1'),
        table(['Area', 'Status today'], [
            ['Screens, navigation, layout', '<b>Working.</b> All screens open; Android keyboard handling fixed app-wide.'],
            ['Camera, gallery, GPS', '<b>Working.</b> Real permissions; GPS address used in Saved Locations, Checkout and "Near me".'],
            ['Barcode / QR scanner', '<b>Working.</b> Reads real barcodes. Only the 8 sample products have barcodes (listed in the second document).'],
            ['Calculators', '<b>Working.</b> Standard formulas, checked by automatic tests. Some inputs are typical figures (sheet coverage, paint spread, appliance watts) and must be confirmed with professionals.'],
            ['Search by photo', '<b>Needs a server.</b> The app takes the photo and is ready to send it, but no matching server exists yet; the user is asked to pick a category instead.'],
            ['Cart, saved items, engineer data, applied jobs', '<b>Works while the app is open.</b> Lost when the app closes.'],
            ['Products, vendors, workers, orders, projects, earnings', '<b>Sample data</b> written in the app code.'],
            ['Login / accounts', '<b>Not built.</b>'],
            ['Chosen profile (role)', '<b>Not saved.</b> Asked every time the app starts.'],
            ['Payments', '<b>Demo only.</b> Placing an order clears the cart and shows an order number made on the phone.'],
            ['AI Building Assistant', '<b>Scripted replies.</b> Not connected to a real AI.'],
            ['Listings, work listings, hire requests, applications, placed orders', '<b>Demo only.</b> A success message shows, but the item does not appear in My Store, Professionals or Orders.'],
        ], [0.36, 0.64]),
        P('8. Problems still open (checked in the code on ' + DATE + ')', 'h1'),
        table(['#', 'Problem', 'Where'], [
            ['1', 'Worker dashboard "View all" opens <i>/my-jobs</i>, which does not exist.', 'worker-dashboard.tsx, line 208'],
            ['2', 'Delivery dashboard is built but no button opens it.', 'delivery-dashboard.tsx'],
            ['3', 'After leaving a dashboard there is no way back to it from the main tabs or Profile.', 'Profile tab'],
            ['4', 'Admin PIN is fixed as "1234" inside the app.', 'settings.tsx, line 10'],
            ['5', 'Buttons that still do nothing: Home (vendor and worker cards, worker "Hire", promo card); Profile (settings icon, Share, Log Out); Product (vendor badge, wishlist heart); Popular Vendors (Visit Store, Call); Order History (Reorder); Orders and My Reviews cards; My Inventory edit and restock.', 'index.tsx, profile.tsx, product/[id].tsx, popular-vendors.tsx, order-history.tsx, orders.tsx, my-reviews.tsx, my-inventory.tsx'],
            ['6', 'What a tester creates does not show up elsewhere: a placed order is not in Orders, a new listing is not in My Store, a work listing is not in Professionals.', 'checkout, add-listing, create-work'],
            ['7', 'The old search bar component still has a filter button that does nothing (used by the Workers marketplace).', 'components/SearchBar.tsx'],
            ['8', 'Status bar colour after leaving a green category header needs checking on a real phone.', 'components/CategoryShell.tsx'],
        ], [0.05, 0.62, 0.33], bold_first=False),
        gap(6),
        P('Fixed since the 30 September review', 'h2'),
        bullets([
            'Nearby <i>Hire</i> and <i>Apply</i> buttons now work; Find Jobs opens on the Jobs list from the worker dashboard.',
            'Upgraded to Expo SDK 57 (fixes the known memory problem in the JavaScript engine).',
            'Keyboard covering forms on Android, and Checkout closing the keyboard after every letter.',
            'Search box losing text on Materials and Professionals; "Near me" always showing nobody; trade filters missing "Master Mason" and similar.',
            'Wrong calculators: cement (about 3 times too few bags), roofing (ignored slope and overhang), plus invented plumbing and electrical formulas.',
            'Fake "bulk deals" with "View deal" buttons that did nothing were removed from all category screens.',
            'Category screens without a back button; broken "Steel & Iron" category link; Settings "Log out" doing nothing.',
        ]),
        gap(4),
        box('Suggestions for fixing these, a <b>test plan to run before building the backend</b>, and the steps to a real launch are in the second document, <b>"BuildLinka - Suggestions for Real-World Launch"</b>.'),
    ]
    build('BuildLinka-Features-by-Profile.pdf', 'BuildLinka - Features by Profile - for review', s)


# ───────────────────────────── Document 2: Suggestions for real-world launch ─────────────────────────────

def suggestions():
    s = [
        P('BuildLinka', 'title'),
        P('Suggestions for real-world launch', 'subtitle'),
        P(f'What is needed to turn the prototype into an app that real vendors, workers, engineers and buyers can trust with real orders and real money, and how to test it with real people <b>before</b> building the backend. {DATE}.', 'intro'),
        box('<b>Summary.</b> The prototype is now much more complete: every category has a working calculator, search has barcode scanning, the engineer area works end to end, and the main forms are fixed. The next step is <b>not</b> the backend yet. First put the prototype in the hands of 20 real users in one city for two weeks (section 2). That shows which screens people really use, checks the calculators against professionals, and collects the real prices and units the database will need. Then build the backend (Convex) around what was learned. Start with buyers and vendors, then add workers, engineers and delivery.'),

        P('1. Fix first (before testing with real users)', 'h1'),
        table(['Fix', 'Status', 'Why'], [
            ['Make Nearby <i>Hire</i> and <i>Apply</i> work.', 'Done', 'Testers would think the app is broken.'],
            ['Upgrade to Expo SDK 57.', 'Done', 'Fixes a known memory problem.'],
            ['Stop the keyboard covering forms; fix Checkout typing.', 'Done', 'Most testers use Android.'],
            ['Set the EAS <i>preview</i> build to make an installable APK; project passes <i>expo-doctor</i> (21 of 21 checks).', 'Done', 'Testers can install from a link.'],
            ['Create a "My jobs" screen or point "View all" to an existing one.', 'To do', 'Opens a "not found" page today.'],
            ['Save the chosen profile on the phone and add a "My dashboard" button on the Profile tab.', 'To do', 'Testers should not pick their role every time. Needs only on-phone storage, no backend.'],
            ['Make the remaining dead buttons work, or hide them for the test (list in the first document, section 8).', 'To do', 'Each dead button costs tester trust and wastes feedback.'],
            ['Show what testers create: placed orders in Orders, new listings in My Store, work listings in Professionals, hire requests on the worker side.', 'To do', 'Testers need to see the result of their action to judge the flow. Can use an in-app store like the engineer one.'],
            ['Keep test data on the phone between app restarts (cart, store, projects, saved places).', 'To do', 'A two-week test spans many app restarts.'],
            ['Link the Delivery dashboard or hide it.', 'To do', 'Unfinished screens confuse reviewers.'],
            ['Hide the admin entry in test builds.', 'To do', 'The PIN "1234" is inside the app.'],
            ['Add a "Send feedback" button (WhatsApp or a form) and crash reporting (for example Sentry).', 'To do', 'Collects feedback and crashes from the phones directly.'],
        ], [0.53, 0.11, 0.36]),

        P('2. Test before building the backend', 'h1'),
        P('Changing a screen now costs hours; changing it after the database, payments and login are built costs weeks. This test answers three questions: <b>do people understand the flows</b>, <b>are the calculators right</b>, and <b>what real data must the backend hold</b>.'),
        P('2.1 How to run the test', 'h2'),
        table(['Item', 'Plan'], [
            ['Length and place', 'Two weeks, one city (Abuja or Lagos).'],
            ['Testers (20)', '7 buyers, 5 vendors, 5 workers, 3 engineers or quantity surveyors. At least 5 on low-cost Android phones (2 to 3 GB memory), a few older users, a few on weak networks.'],
            ['Install', 'Android first. Run <i>npx eas-cli build -p android --profile preview</i>. The <i>preview</i> profile in eas.json already builds an <b>APK</b>, so testers install it straight from the build link (no Play Store). Answer <i>Yes</i> to "Generate a new Android Keystore?" on the first build. iPhone testers later through TestFlight (needs an Apple Developer account).'],
            ['Brief', 'A short WhatsApp message: this is a test app, the data is sample data, nothing real is bought or paid, and how to send feedback.'],
            ['Group', 'One WhatsApp group per profile for questions, plus a 15-minute call with each tester at the end.'],
        ], [0.2, 0.8]),
        P('2.2 Tasks for each profile', 'h2'),
        P('Ask each tester to try these without help. Write down if they finish, how long it takes, and where they hesitate.'),
        table(['Profile', 'Task', 'Success when'], [
            ['Buyer', 'Find Dangote cement using Search.', 'Opens the product in under 30 seconds.'],
            ['Buyer', 'Scan a printed sample barcode (section 2.4).', 'Product opens on the first or second try.'],
            ['Buyer', 'Use the Cement calculator for a 10 × 8 m floor, 100 mm thick, and add the bags to the cart.', 'Cart shows the bags (the app gives 54 with 5% extra).'],
            ['Buyer', 'Check out with Pickup station.', 'Reaches the success screen without help.'],
            ['Buyer', 'Find an available mason near you and send a hire request for 3 days.', 'Card shows "Requested".'],
            ['Vendor', 'Create a listing with 2 photos, price and stock.', 'Published in under 3 minutes.'],
            ['Vendor', 'Restock a low-stock item in My Store, then mark a listing as sold.', 'Stock and status change.'],
            ['Vendor', 'Turn off "Accepting orders" in Settings; save the shop location with GPS and rename it.', 'Both done without help.'],
            ['Worker', 'Create a work listing.', 'Published; no field hidden by the keyboard.'],
            ['Worker', 'From the dashboard, find jobs for your trade and apply to one.', 'Button shows "Applied".'],
            ['Engineer', 'Create a project, log an expense, schedule a site visit and mark it done.', 'All four done; numbers on the dashboard change.'],
            ['Engineer', 'Move a spec from Draft to Approved; call a team member.', 'Status changes; phone dialler opens.'],
        ], [0.12, 0.55, 0.33], bold_first=True),

        P('2.3 Phone checklist', 'h2'),
        P('Tick each item on at least one low-cost Android phone and, when available, one iPhone.'),
        table(['Check', 'How'], [
            ['Keyboard', 'Type in every form (Add Listing, Create Work, Checkout, Saved Locations, calculators). No field or button may hide behind the keyboard.'],
            ['Permissions', 'Deny camera, gallery and location the first time, then allow them. The app must explain and recover, never crash.'],
            ['Barcode scanner', 'Scan the printed codes below in good and poor light, with and without the flashlight.'],
            ['GPS', 'Saved Locations, Checkout "Use my current location" and Professionals "Near me", indoors and outdoors. Check the address is correct.'],
            ['Dropdowns', 'Trade, Sort, Category and Project-status menus must open directly under their button.'],
            ['Status bar', 'After leaving a green category screen, the clock and battery must be readable on light screens.'],
            ['Back button', 'Every screen can be left with the back arrow and the Android back gesture.'],
            ['Large text', 'Set the phone to large font. Text must not be cut off or overlap.'],
            ['Weak network', 'Use the app on slow data and in airplane mode. It must not crash (it needs no internet yet, except maps and directions).'],
            ['Small screen', 'Use a 5-inch phone. Bottom buttons must stay reachable.'],
        ], [0.2, 0.8]),
        P('2.4 Sample barcodes for the scanner test', 'h2'),
        P('Print these EAN-13 codes with any free online barcode generator and stick them on a box or sheet of paper.'),
        table(['Product', 'Barcode', 'Product', 'Barcode'], [
            ['Dangote Cement 42.5R', '6151234000015', 'Ceramic Floor Tiles 60×60', '6151234000053'],
            ['Elephant Cement', '6151234000022', 'PVC Water Pipe 3/4"', '6151234000060'],
            ['Aluminium Roofing Sheet', '6151234000039', 'Sandcrete Block 9"', '6151234000077'],
            ['Iron Rod 12 mm', '6151234000046', 'Emulsion Paint 20 L', '6151234000084'],
        ], [0.3, 0.2, 0.3, 0.2]),
        P('A QR code with the text <i>buildlinka://product/p1</i> (p1 to p8) also opens the product.'),
        P('2.5 Check the calculators with professionals', 'h2'),
        P('Give a professional the same example, compare their figure with the app, and aim to be within 10%. If not, the assumption is one line in the app\'s <i>lib</i> folder and is easy to change.'),
        table(['Calculator', 'Check with', 'Example (app result)'], [
            ['Cement', 'Mason or site engineer', '10 × 8 m floor, 100 mm, 1:2:4, +5% → 54 bags, 5.9 t sand, 11.1 t granite'],
            ['Steel & Iron', 'Structural engineer\'s bar schedule', '5 × 4 m slab, 12 mm at 200 mm, top and bottom, +10% → 387 kg, 37 bars of 12 m'],
            ['Roofing', 'Roofer\'s quote', '12 × 10 m house, gable, 25°, 0.6 m overhang, aluminium, +10% → 100 sheets'],
            ['Blocks', 'Mason', '40 m of wall, 3 m high, 2 doors, 4 windows, 9", +5% → 1,073 blocks'],
            ['Tiles', 'Tiler', '5 × 4 m floor, 60 × 60, straight → 22 m², 62 tiles, 4 bags adhesive'],
            ['Paint', 'Painter and the paint maker\'s data sheet', '4 × 4 m room, 3 m high, 1 door, 1 window, 2 coats → 8.9 L'],
            ['Electrical', 'Electrician or solar installer', '6 bulbs, 2 fans, TV, 2 laptops, fridge (590 W), 4 h backup → 1 kVA, 2.5 mm² cable, 3.3 kWh battery'],
            ['Plumbing', 'Plumber', '5 people, 100 L each, 2 days → 1,000 L tank'],
        ], [0.15, 0.27, 0.58]),

        P('2.6 Collect the real data the backend will need', 'h2'),
        table(['Data', 'Why'], [
            ['Real product lists from 5 vendors: brands, sizes, units (bag, tonne, length, m², box, trip) and prices.', 'Becomes the first product catalogue and shows which units the database must support.'],
            ['Delivery areas and fees from vendors and truck owners.', 'Needed to price delivery by distance and weight.'],
            ['Day rates per trade and area from workers.', 'Realistic pricing and search filters.'],
            ['How testers want to log in (phone code, email) and pay (transfer, card, USSD, pay on delivery).', 'Decides login and payment set-up.'],
            ['The 5 most confusing screens and the 5 most wanted missing features.', 'Sets the priorities for the backend.'],
            ['Whether vendors would pay a commission or a monthly plan, and how much.', 'Confirms the business model (section 10).'],
        ], [0.55, 0.45]),
        P('2.7 How to collect feedback', 'h2'),
        bullets([
            'A "Send feedback" button that opens WhatsApp or a short form, so feedback arrives with the screen name.',
            'Screen recordings, with the tester\'s permission, for the 15-minute end call.',
            'One shared bug list with three levels: <b>P0</b> crash or blocks a task, <b>P1</b> confusing, <b>P2</b> nice to have.',
            'Crash reports from the test build (for example Sentry) so crashes are seen even when no one reports them.',
        ]),
        P('2.8 Ready to start the backend when…', 'h2'),
        bullets([
            'There are <b>no open P0 bugs</b>.',
            'At least <b>8 of 10 testers per profile</b> finish their tasks without help.',
            'Calculators are <b>within 10%</b> of the professionals\' figures.',
            'A real product catalogue exists for at least 2 categories (for example cement and blocks).',
            'Login and payment choices are decided.',
        ]),
        box('<b>Tip:</b> keep the app\'s screens the same during the test. Collect requests, then change everything once, before the backend, rather than shipping a new build every few days.', AMBER),

        P('3. The backend (after testing)', 'h1'),
        P('Accounts and login', 'h2'),
        bullets([
            '<b>Phone number + SMS code</b> as the main login (most users are phone-first); email optional. Use a Nigerian-friendly SMS provider (for example Termii) or Twilio.',
            '<b>One account, several roles</b>: a vendor may also buy; an engineer may hire workers.',
            'Roles and permissions checked on the <b>server</b>, never only in the app. Replace the admin PIN with a real admin role.',
        ]),
        P('Server and database: Convex', 'h2'),
        bullets([
            '<b>Convex</b> (the chosen backend): database, server functions, file storage and live updates in one place. Live updates suit order status, stock levels and project changes. Start on the free cloud plan; data can be exported and moved to a self-hosted Convex server later if needed.',
            'Product photos, profile photos and documents compressed on the phone, then stored in Convex file storage.',
            'Real <b>push notifications</b> (expo-notifications) for new orders, hire requests, applications, delivery updates, low stock and site-visit reminders.',
            'Works on slow networks: cache lists, show saved data offline, queue actions and retry when the network returns.',
            '<b>Photo search</b>: a server function that receives the photo (the app already sends it to <i>EXPO_PUBLIC_IMAGE_SEARCH_URL</i>), asks an image AI model, and returns matching products. The AI key stays on the server.',
        ]),
        P('What the database must store (taken from the screens)', 'h2'),
        table(['Area', 'Records'], [
            ['People', 'Users, roles, verification documents, saved locations, settings (accepting orders, alerts, hide profile).'],
            ['Selling', 'Stores, products (with barcode, unit, photos, category), stock levels and movements, price history.'],
            ['Buying', 'Carts, orders, order items, delivery method and address, payments, refunds.'],
            ['Work', 'Work listings, hire requests (days, cost, status), job posts, applications, reviews.'],
            ['Projects', 'Projects, members, expenses, site visits, specifications and their approval history.'],
            ['Platform', 'Notifications, featured banners, reports, disputes, feedback, calculator results saved by users.'],
        ], [0.18, 0.82]),

        P('4. Payments and trust', 'h1'),
        bullets([
            '<b>Paystack</b> for card, bank transfer and USSD. Payment confirmed by the server (Paystack webhook), never only by the app.',
            '<b>Escrow / held payment</b>: BuildLinka holds the money and releases it to the vendor after delivery is confirmed, or to the worker after each job stage. This is the main reason people will trust the platform.',
            'Paystack split payments / subaccounts to pay vendors and workers automatically and keep BuildLinka\'s commission.',
            'Clear refund, cancellation and dispute process, with an admin screen to resolve disputes.',
            'Reviews only after a completed order or job, so ratings are real.',
        ]),

        P('5. Suggestions per profile', 'h1'),
        P('Vendor', 'h2'),
        table(['Suggestion', 'Real-world reason'], [
            ['Business verification (CAC registration, owner ID, shop address and photos) and a "Verified vendor" badge.', 'Buyers fear fake sellers.'],
            ['Stock goes down automatically when an order is placed; vendor accepts or rejects each order.', 'Stops selling items that are out of stock.'],
            ['Real units and <b>bulk price tiers</b> (half trailer, trailer load). Bring back bulk deals once the cart can apply discounts.', 'Builders buy in large, mixed units.'],
            ['Fast price update screen (many prices at once).', 'Cement and rod prices change often.'],
            ['<b>Quote requests from calculators</b>: a buyer\'s calculator result goes to several vendors who reply with a price.', 'Turns the calculators into sales for items not listed yet.'],
            ['Delivery areas and fees; payout history and downloadable sales reports.', 'Heavy goods; vendors need records.'],
        ], [0.6, 0.4]),
        P('Worker', 'h2'),
        table(['Suggestion', 'Real-world reason'], [
            ['Identity check (NIN), phone check, optional trade certificate, "Verified" badge.', 'Clients let workers into their property.'],
            ['Portfolio of past work photos.', 'Clients judge quality by past jobs.'],
            ['Accept, decline or counter-offer hire requests (price, date).', 'Real jobs are negotiated.'],
            ['Stage payments held in escrow; availability calendar instead of only a switch.', 'Protects both sides; avoids double booking.'],
            ['Phone numbers hidden until a job is accepted (in-app chat or call).', 'Keeps deals on the platform and protects privacy.'],
        ], [0.6, 0.4]),
        P('Engineer', 'h2'),
        table(['Suggestion', 'Real-world reason'], [
            ['Verify the COREN licence before showing the badge.', 'Engineer approval is a legal and safety matter.'],
            ['Shared project workspace for owner, engineer, workers and vendors.', 'One place for everyone on a site.'],
            ['<b>Bill of Quantities from the calculators</b> (cement, rebar, blocks, roofing) that the buyer can order in one tap.', 'Connects planning directly to sales.'],
            ['Site inspection reports with photos, GPS and time stamp, and a sign-off.', 'Proof of work and quality control.'],
            ['Document upload with versions; budget "spent" filled automatically from real orders and worker payments.', 'Specs change; no manual typing of costs.'],
        ], [0.6, 0.4]),
        P('Buyer', 'h2'),
        table(['Suggestion', 'Real-world reason'], [
            ['Order tracking with live status and a delivery code or photo on delivery.', 'Proof the goods arrived.'],
            ['Compare the same product across vendors by price, distance and rating (started on the Cement screen).', 'Buyers shop around.'],
            ['Save calculator results to a project; plan vs actual budget per project.', 'Most builds go over budget.'],
            ['Turn a Build Project plan into a ready cart and a list of workers to hire.', 'Makes the planner useful, not just informative.'],
            ['Schedule delivery date and time; pay in stages for large projects.', 'Sites cannot store everything; buyers build as money comes in.'],
        ], [0.6, 0.4]),

        P('6. Delivery (logistics)', 'h1'),
        bullets([
            'Add a fifth profile, <b>Driver / Logistics partner</b>, using the delivery dashboard that already exists.',
            'Delivery fee by distance and weight or volume (a truck of blocks is not a bike parcel). The calculators already give weights and quantities.',
            'Driver app: accept delivery, navigation, pickup confirmation at the vendor, delivery confirmation with the buyer\'s code and photo.',
            'Start by partnering with existing truck owners and logistics companies rather than owning vehicles.',
        ]),
        P('7. Admin and operations', 'h1'),
        bullets([
            'Move the admin panel to a <b>separate web dashboard</b> with its own secure login (two-step verification), not inside the phone app.',
            'Approval queue for new vendors, workers, engineers and listings (the "under review" messages already expect this).',
            'Dispute and refund handling, user suspension, and reports of fake listings.',
            'Customer support by WhatsApp and phone, with the help center inside the app.',
            'Crash and error reporting and usage analytics to see where users drop off (start during the test, section 2).',
        ]),
        P('8. AI features', 'h1'),
        bullets([
            'Connect the Building Assistant chat to a real AI model through BuildLinka\'s server; never put an AI key inside the app.',
            'Use the same tested formulas as the calculators and <b>real vendor prices</b> from the platform, so plans match the market.',
            'Photo search through the server (section 3).',
            'Always label results as estimates and offer "Get an engineer to review this plan", which also brings work to engineers.',
        ]),
        P('9. Local needs, law and safety', 'h1'),
        bullets([
            'Nigeria Data Protection Act (NDPA): privacy policy, consent, secure storage of IDs and personal data.',
            'Terms of service covering payments, escrow, cancellations and disputes.',
            'Languages: English first, then Hausa, Yoruba, Igbo and Pidgin.',
            'Low-cost Android phones and slow networks: small images, fast loading, low data use; support large text.',
            'Payment options Nigerians use: bank transfer, USSD and card, and possibly pay on delivery for trusted buyers.',
            'Calculator results are estimates: keep the footnotes, and advise users to confirm with a professional before ordering large quantities.',
        ]),
        P('10. How BuildLinka can earn money', 'h1'),
        table(['Source', 'How'], [
            ['Commission', 'A small percentage on each material order and each worker job paid through the app.'],
            ['Delivery margin', 'Part of each delivery fee.'],
            ['Vendor subscription', 'Monthly plan for more listings, analytics and store branding.'],
            ['Featured listings', 'Vendors and workers pay to appear in featured banners and at the top of search.'],
            ['Quote requests', 'Vendors pay a small fee or commission for quote requests won from calculator results.'],
            ['Pro tools', 'Paid project workspace features for engineers and construction companies.'],
        ], [0.22, 0.78]),

        P('11. Suggested roadmap', 'h1'),
        table(['Phase', 'What to build', 'Goal'], [
            ['1. Fix and test (now, about 4 weeks)', 'The "to do" fixes in section 1, a test build, two weeks of testing with 20 users (section 2), then one round of changes.', 'Flows proven with real people; real data collected.'],
            ['2. MVP launch in one city', 'Login, Convex backend, vendor listings and stock, buyer orders, Paystack with escrow, push notifications, admin approval. Vendor and Buyer profiles only.', 'First real orders.'],
            ['3. Workers', 'Verification, hire requests and applications, stage payments, reviews, availability calendar.', 'Hiring through the app.'],
            ['4. Engineers and delivery', 'COREN check, project workspace, Bill of Quantities to cart, site reports; driver profile and delivery tracking.', 'A whole project on one platform.'],
            ['5. Growth', 'Real AI planner and photo search, quote requests, more cities, languages, subscriptions and analytics.', 'Scale.'],
        ], [0.25, 0.55, 0.2]),
        gap(6),
        box('<b>Advice:</b> test first, then launch the buyer–vendor order loop and make it excellent. When buyers trust BuildLinka with material orders, adding workers, engineers and delivery becomes much easier.'),
    ]
    build('BuildLinka-Real-World-Suggestions.pdf', 'BuildLinka - Suggestions for Real-World Launch', s)


if __name__ == '__main__':
    features()
    suggestions()
    print('PDFs written to', OUT)
