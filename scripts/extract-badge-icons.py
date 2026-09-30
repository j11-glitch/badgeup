"""Make the badge icons and the logo in public/badges/.

Most icons are cut out of assets/badges-source.webp: each is cropped from a hand-measured box
and its dark background is made transparent. Some icons have their own picture in assets/
(see OWN_PICTURES); those come on a drawn checkerboard, which is removed. The logo also
becomes the favicon and the home-screen icons. Needs Pillow:
python3 scripts/extract-badge-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "badges-source.webp"
OUT = ROOT / "public" / "badges"
SIZE = 256
BACKGROUND = (13, 25, 39)
THRESHOLD = 22  # channel difference from the background that counts as "icon"
RAMP = 48  # background-like pixels at the edge fade out over this difference

# Icons with their own picture: really transparent, or on a drawn checkerboard or black.
OWN_PICTURES = {
    "logo": ROOT / "assets" / "logo-source.webp",
    "beta-tester": ROOT / "assets" / "matglad-source.webp",
    "patient": ROOT / "assets" / "talmodig-source.webp",
    "tooth-star": ROOT / "assets" / "tannstjerne-source.webp",
    "outdoors": ROOT / "assets" / "friluftsliv-source.webp",
    "screen-smart": ROOT / "assets" / "skjermsmart-source.webp",
    "dedicated": ROOT / "assets" / "treningsglad-source.webp",
    "explorer": ROOT / "assets" / "bokorm-source.webp",
    "getting-started": ROOT / "assets" / "lytteore-source.webp",
    "early-bird": ROOT / "assets" / "morgenfugl-source.webp",
}

# (x0, y0, x1, y1) boxes in the source picture; each holds one icon and no label text.
BOXES = {
    "bronze": (738, 85, 858, 222),
    "silver": (882, 85, 1003, 222),
    "gold": (1025, 78, 1155, 222),
    "platinum": (1176, 70, 1312, 222),
    "legend": (1325, 62, 1502, 224),
    "first-step": (42, 340, 192, 485),
    "on-a-roll": (475, 340, 620, 485),
    "milestone": (1118, 340, 1265, 485),
    "master": (1322, 335, 1498, 485),
    "streak": (468, 590, 600, 720),
    "big-streak": (660, 590, 822, 720),
    "creator": (1110, 590, 1248, 720),
    "team-player": (52, 828, 172, 940),
    "helpful": (228, 822, 342, 940),
    "mentor": (566, 822, 682, 940),
    "collaborator": (743, 822, 868, 940),
    "founder": (1368, 830, 1480, 940),
}


def difference(pixel: tuple[int, int, int]) -> int:
    return max(abs(c - b) for c, b in zip(pixel, BACKGROUND))


def cut_out(crop: Image.Image) -> Image.Image:
    w, h = crop.size
    px = crop.load()
    diff = [[difference(px[x, y]) for x in range(w)] for y in range(h)]

    # The icon is the non-background shape under the centre of the box.
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if diff[y][x] > THRESHOLD:
                mp[x, y] = 255
    cx, cy = w // 2, h // 2
    seed = min(
        ((x, y) for y in range(h) for x in range(w) if mp[x, y] == 255),
        key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2,
    )
    ImageDraw.floodfill(mask, seed, 128)
    shape = mask.point(lambda v: 255 if v == 128 else 0)

    # Background reachable from the border is outside; holes inside the shape are kept.
    outside = shape.point(lambda v: 0 if v else 255)
    ImageDraw.floodfill(outside, (0, 0), 100)
    op = outside.load()
    edge = shape.filter(ImageFilter.MaxFilter(7)).load()

    result = Image.new("RGBA", (w, h))
    rp = result.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if op[x, y] != 100:
                rp[x, y] = (r, g, b, 255)
            elif edge[x, y]:
                alpha = min(1.0, diff[y][x] / RAMP)
                if alpha < 0.05:
                    continue
                # Undo the blend with the dark background so edges look clean on any colour.
                color = [round(min(255, max(0, (c - bg * (1 - alpha)) / alpha))) for c, bg in zip((r, g, b), BACKGROUND)]
                rp[x, y] = (*color, round(alpha * 255))
    return result


def square(icon: Image.Image, size: int) -> Image.Image:
    icon = icon.crop(icon.getbbox())
    side = max(icon.size)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(icon, ((side - icon.width) // 2, (side - icon.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def remove_background(picture: Image.Image) -> Image.Image:
    """Makes the background around the icon transparent.

    A picture that is already transparent is kept as it is. Otherwise the background is either
    a drawn grey-and-white checkerboard (light, nearly grey pixels) or plain black. Only
    background pixels connected to the border are removed, so light or dark parts inside the
    icon (a knife, a highlight, a dark screen) stay.
    """
    if picture.mode == "RGBA" and picture.getpixel((0, 0))[3] == 0:
        return picture
    rgb = picture.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    dark = max(px[0, 0]) < 40

    def is_background(r: int, g: int, b: int) -> bool:
        if dark:
            return max(r, g, b) < 40
        return min(r, g, b) > 165 and max(r, g, b) - min(r, g, b) < 22

    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if is_background(*px[x, y]):
                mp[x, y] = 255
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mp[x, y] == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
    # Grow the cut by a pixel to drop the fringe, then soften the edge.
    outside = mask.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(3))
    alpha = outside.point(lambda v: 255 - v).filter(ImageFilter.GaussianBlur(1))
    icon = rgb.convert("RGBA")
    icon.putalpha(alpha)
    return icon


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, box in BOXES.items():
        square(cut_out(source.crop(box)), SIZE).save(OUT / f"{name}.png", optimize=True)
    for name, path in OWN_PICTURES.items():
        square(remove_background(Image.open(path)), 512).resize((SIZE, SIZE), Image.LANCZOS).save(
            OUT / f"{name}.png", optimize=True
        )
    mark = square(remove_background(Image.open(OWN_PICTURES["logo"])), 512)
    for file, size in [("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512), ("favicon.png", 64)]:
        mark.resize((size, size), Image.LANCZOS).save(ROOT / "public" / file, optimize=True)
    print(f"{len(BOXES) + len(OWN_PICTURES)} icons written to {OUT}")


if __name__ == "__main__":
    main()
