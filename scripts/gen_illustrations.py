"""Generate the 5 homepage illustration assets (public/images/1..5.png).

Flat geometric education-SaaS style, white background, drawn at 3x then
downsampled with LANCZOS for crisp antialiased edges. Matches the supplied
reference: phone+QR, teacher dashboard, result screen, clipboard+plant, shield.
"""
import os
from PIL import Image, ImageDraw

SS = 3  # supersample factor
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images")
os.makedirs(OUT, exist_ok=True)

# palette
NAVY = (30, 58, 138)        # #1E3A8A deep frame
BLUE = (37, 99, 235)        # #2563EB
BLUE_D = (29, 78, 216)      # #1D4ED8
BLUE_L = (96, 165, 250)     # #60A5FA
BLUE_50 = (239, 246, 255)   # #EFF6FF
BLUE_100 = (219, 234, 254)  # #DBEAFE
BLUE_200 = (191, 219, 254)  # #BFDBFE
GREEN = (34, 197, 94)       # #22C55E
GREEN_D = (22, 160, 107)    # #16A06B
GREEN_50 = (236, 253, 245)  # #ECFDF5
GREEN_100 = (220, 252, 231)
YELLOW = (250, 204, 21)     # accent
SLATE = (148, 163, 184)     # #94A3B8
SLATE_L = (203, 213, 225)   # #CBD5E1
SLATE_50 = (241, 245, 249)
WHITE = (255, 255, 255)
INK = (17, 24, 39)


def canvas(w, h):
    img = Image.new("RGBA", (w * SS, h * SS), (255, 255, 255, 255))
    return img, ImageDraw.Draw(img)


def s(v):
    return int(round(v * SS))


def rrect(d, box, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = [s(v) for v in box]
    d.rounded_rectangle([x0, y0, x1, y1], radius=s(radius),
                        fill=fill, outline=outline, width=s(width))


def thick_line(d, pts, width, color):
    """Polyline with round caps/joins."""
    w = s(width)
    spts = [(s(x), s(y)) for x, y in pts]
    d.line(spts, fill=color, width=w, joint="curve")
    r = w // 2
    for x, y in spts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def check(d, cx, cy, size, width, color):
    thick_line(d, [(cx - size * 0.55, cy + size * 0.05),
                   (cx - size * 0.12, cy + size * 0.45),
                   (cx + size * 0.6, cy - size * 0.45)], width, color)


def finalize(img, name, target_w):
    th = int(round(img.height * target_w / img.width))
    out = img.resize((target_w, th), Image.LANCZOS).convert("RGB")
    path = os.path.join(OUT, name)
    out.save(path, "PNG", optimize=True)
    print(f"{name}: {out.size}  {os.path.getsize(path)//1024}KB")


# ---------------------------------------------------------------- 1. phone + link + QR
def gen_phone():
    W, H = 420, 420          # square canvas so it fills the square card box
    img, d = canvas(W, H)
    # decorative dots
    for (x, y, r, c) in [(54, 118, 9, BLUE_200), (368, 96, 11, BLUE_100),
                         (60, 312, 12, BLUE_100), (366, 330, 9, GREEN),
                         (352, 214, 7, BLUE_200), (70, 220, 7, BLUE_200)]:
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=c)
    # phone body (160 x 300 -> natural smartphone ratio ~0.53)
    px0, py0, px1, py1 = 130, 62, 290, 362
    rrect(d, (px0, py0, px1, py1), 30, fill=WHITE, outline=NAVY, width=9)
    rrect(d, (px0 + 14, py0 + 24, px1 - 14, py1 - 24), 18, fill=BLUE_50)
    # speaker notch
    d.rounded_rectangle([s(198), s(74), s(222), s(81)], radius=s(4), fill=BLUE_200)
    # link badge (top inside)
    lcx, lcy = 210, 150
    d.ellipse([s(lcx - 36), s(lcy - 36), s(lcx + 36), s(lcy + 36)], fill=BLUE)
    # clean chain-link glyph: two interlocking capsule rings, tilted 45deg
    def capsule(L, Tk, wd):
        pad = s(wd) + 2
        layer = Image.new("RGBA", (s(L) + pad * 2, s(Tk) + pad * 2), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle([pad, pad, pad + s(L), pad + s(Tk)],
                             radius=s(Tk) // 2, outline=WHITE, width=s(wd))
        return layer.rotate(45, expand=True, resample=Image.BICUBIC)
    cap = capsule(30, 19, 7)
    off = 11  # offset along 45deg axis so the two links interlock
    import math as _m
    dx = int(off * _m.cos(_m.radians(45)) * SS)
    dy = int(off * _m.sin(_m.radians(45)) * SS)
    a = (s(lcx) - cap.width // 2 - dx, s(lcy) - cap.height // 2 + dy)
    b = (s(lcx) - cap.width // 2 + dx, s(lcy) - cap.height // 2 - dy)
    img.alpha_composite(cap, a)
    img.alpha_composite(cap, b)
    # QR block (bottom inside)
    qx, qy, qs = 165, 228, 90
    rrect(d, (qx, qy, qx + qs, qy + qs), 10, fill=WHITE, outline=BLUE_100, width=3)
    n = 7
    cell = qs / n
    pattern = [
        "1110111",
        "1010101",
        "1110111",
        "0001000",
        "1011101",
        "0100010",
        "1110111",
    ]
    for r in range(n):
        for c in range(n):
            if pattern[r][c] == "1":
                bx = qx + 6 + c * (qs - 12) / n
                by = qy + 6 + r * (qs - 12) / n
                cw = (qs - 12) / n
                d.rounded_rectangle([s(bx), s(by), s(bx + cw - 2), s(by + cw - 2)],
                                    radius=s(2), fill=BLUE_D)
    # finder corners stronger
    for (fx, fy) in [(qx + 6, qy + 6), (qx + qs - 6 - (qs - 12) / n * 2.0, qy + 6),
                     (qx + 6, qy + qs - 6 - (qs - 12) / n * 2.0)]:
        sz = (qs - 12) / n * 2.0
        d.rounded_rectangle([s(fx), s(fy), s(fx + sz), s(fy + sz)], radius=s(4),
                            outline=BLUE, width=s(3))
    finalize(img, "1.png", 460)


# ---------------------------------------------------------------- 2. teacher dashboard
def gen_dashboard():
    W, H = 480, 380
    img, d = canvas(W, H)
    for (x, y, r, c) in [(36, 60, 9, BLUE_100), (446, 300, 10, GREEN),
                         (446, 70, 8, BLUE_200), (40, 320, 9, BLUE_100)]:
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=c)
    # panel
    rrect(d, (64, 50, 416, 330), 22, fill=WHITE, outline=NAVY, width=8)
    # top bar
    rrect(d, (64, 50, 416, 96), 22, fill=BLUE_50)
    d.rectangle([s(64), s(86), s(416), s(96)], fill=BLUE_50)
    for i, c in enumerate([BLUE, BLUE_L, GREEN]):
        d.ellipse([s(86 + i * 22 - 6), s(67), s(86 + i * 22 + 6), s(79)], fill=c)
    rrect(d, (300, 66, 396, 80), 7, fill=BLUE_100)
    # avatars row
    ax = [110, 175, 240]
    acol = [BLUE, BLUE_L, GREEN]
    for x, col in zip(ax, acol):
        d.ellipse([s(x - 16), s(120), s(x + 16), s(152)], fill=col)  # head
        d.pieslice([s(x - 24), s(160), s(x + 24), s(210)], 180, 360, fill=col)  # shoulders
    # bar chart (left bottom)
    base = 296
    bx = 104
    bars = [(0, 40, BLUE_L), (1, 64, BLUE), (2, 52, BLUE_L), (3, 80, BLUE)]
    for i, h, col in bars:
        x = bx + i * 26
        rrect(d, (x, base - h, x + 16, base), 5, fill=col)
    # donut (right bottom)
    cx, cy, r = 330, 250, 44
    # segments via pieslice
    d.pieslice([s(cx - r), s(cy - r), s(cx + r), s(cy + r)], -90, 110, fill=BLUE)
    d.pieslice([s(cx - r), s(cy - r), s(cx + r), s(cy + r)], 110, 210, fill=GREEN)
    d.pieslice([s(cx - r), s(cy - r), s(cx + r), s(cy + r)], 210, 270, fill=YELLOW)
    ir = 22
    d.ellipse([s(cx - ir), s(cy - ir), s(cx + ir), s(cy + ir)], fill=WHITE)
    finalize(img, "2.png", 470)


# ---------------------------------------------------------------- 3. result presentation screen
def gen_result():
    W, H = 460, 420
    img, d = canvas(W, H)
    for (x, y, r, c) in [(40, 70, 9, BLUE_100), (424, 90, 10, BLUE_200),
                         (424, 300, 9, GREEN), (44, 300, 8, BLUE_100)]:
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=c)
    # screen frame
    rrect(d, (70, 56, 390, 300), 20, fill=WHITE, outline=NAVY, width=9)
    rrect(d, (90, 76, 370, 280), 12, fill=BLUE_50)
    # bars ascending
    base = 256
    bx = 122
    data = [(0, 60, BLUE_L), (1, 96, BLUE), (2, 132, BLUE), (3, 168, GREEN)]
    for i, h, col in data:
        x = bx + i * 56
        rrect(d, (x, base - h, x + 34, base), 8, fill=col)
    # baseline
    thick_line(d, [(108, 262), (352, 262)], 4, SLATE_L)
    # stand
    thick_line(d, [(230, 300), (230, 336)], 9, NAVY)
    thick_line(d, [(184, 356), (276, 356)], 11, NAVY)
    thick_line(d, [(230, 336), (190, 356)], 9, NAVY)
    thick_line(d, [(230, 336), (270, 356)], 9, NAVY)
    finalize(img, "3.png", 470)


# ---------------------------------------------------------------- 4. clipboard + plant
def gen_clipboard():
    W, H = 480, 400
    img, d = canvas(W, H)
    for (x, y, r, c) in [(40, 70, 8, BLUE_100), (300, 60, 9, BLUE_200)]:
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=c)
    # clipboard board
    rrect(d, (70, 70, 290, 360), 18, fill=WHITE, outline=SLATE, width=8)
    # clip
    rrect(d, (150, 56, 210, 86), 10, fill=SLATE_50, outline=SLATE, width=6)
    rrect(d, (166, 48, 194, 66), 6, fill=SLATE)
    # rows: green check box + line
    ys = [128, 180, 232, 284]
    for y in ys:
        rrect(d, (96, y - 16, 128, y + 16), 8, fill=GREEN_50, outline=GREEN_100, width=3)
        check(d, 112, y, 22, 6, GREEN)
        rrect(d, (146, y - 8, 256, y + 8), 8, fill=SLATE_50)
    # plant pot (right)
    pcx = 372
    rrect(d, (pcx - 40, 300, pcx + 40, 360), 12, fill=BLUE_100)
    d.polygon([(s(pcx - 40), s(300)), (s(pcx + 40), s(300)),
               (s(pcx + 32), s(360)), (s(pcx - 32), s(360))], fill=BLUE_100)
    rrect(d, (pcx - 46, 292, pcx + 46, 308), 8, fill=BLUE_200)
    # leaves
    for ang, ln, col in [(-30, 70, GREEN), (0, 86, GREEN_D), (30, 70, GREEN)]:
        import math
        rad = math.radians(ang - 90)
        ex = pcx + ln * math.cos(rad)
        ey = 292 + ln * math.sin(rad)
        # leaf as ellipse rotated approximate: use small filled circle chain
        thick_line(d, [(pcx, 292), (ex, ey)], 5, GREEN_D)
        leaf = Image.new("RGBA", (s(70), s(40)), (0, 0, 0, 0))
        ld = ImageDraw.Draw(leaf)
        ld.ellipse([0, 0, s(60), s(34)], fill=col)
        leaf = leaf.rotate(-(ang - 90) - 90, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(leaf, (int(s(ex) - leaf.width / 2), int(s(ey) - leaf.height / 2)))
    finalize(img, "4.png", 460)


# ---------------------------------------------------------------- 5. shield + check
def gen_shield():
    W, H = 400, 440
    img, d = canvas(W, H)
    for (x, y, r, c) in [(50, 90, 9, BLUE_100), (350, 110, 10, BLUE_200),
                         (340, 330, 9, GREEN), (56, 330, 8, BLUE_100)]:
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=c)
    cx = 200
    top = 70
    w = 150
    pts = [
        (cx - w, top + 30),
        (cx, top),
        (cx + w, top + 30),
        (cx + w, top + 150),
    ]
    # shield outline path approximated with polygon + bottom point
    shield = [
        (cx - w, top + 26),
        (cx, top),
        (cx + w, top + 26),
        (cx + w, top + 150),
        (cx, top + 300),
        (cx - w, top + 150),
    ]
    sp = [(s(x), s(y)) for x, y in shield]
    d.polygon(sp, fill=BLUE_50, outline=SLATE)
    # outline thicker
    d.line(sp + [sp[0]], fill=SLATE, width=s(8), joint="curve")
    for x, y in sp:
        rr = s(4)
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=SLATE)
    # green check circle
    gcx, gcy, gr = cx, top + 150, 56
    d.ellipse([s(gcx - gr), s(gcy - gr), s(gcx + gr), s(gcy + gr)], fill=GREEN)
    check(d, gcx, gcy, 56, 12, WHITE)
    finalize(img, "5.png", 420)


if __name__ == "__main__":
    gen_phone()
    gen_dashboard()
    gen_result()
    gen_clipboard()
    gen_shield()
    print("done")
