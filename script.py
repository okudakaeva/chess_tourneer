from PIL import Image, ImageEnhance

img = Image.open("images/gray_wall.webp").convert("RGBA")
w, h = img.size

size = 512
left = (w - size) // 2
top = (h - size) // 2
crop = img.crop((left, top, left + size, top + size))

overlap = 64

def blend_axis(im, is_horizontal):
    w_im, h_im = im.size
    if is_horizontal:
        main = im.crop((0, 0, w_im - overlap, h_im))
        edge = im.crop((w_im - overlap, 0, w_im, h_im))
        mask = Image.linear_gradient("L").resize((overlap, h_im)).rotate(90, expand=True).resize((overlap, h_im))
        part = main.crop((0, 0, overlap, h_im))
        blended = Image.composite(edge, part, mask)
        main.paste(blended, (0, 0))
        return main
    else:
        main = im.crop((0, 0, w_im, h_im - overlap))
        edge = im.crop((0, h_im - overlap, w_im, h_im))
        mask = Image.linear_gradient("L").resize((w_im, overlap))
        part = main.crop((0, 0, w_im, overlap))
        blended = Image.composite(edge, part, mask)
        main.paste(blended, (0, 0))
        return main

res = blend_axis(crop, True)
res = blend_axis(res, False)

res = ImageEnhance.Contrast(res).enhance(1.15)
res = ImageEnhance.Sharpness(res).enhance(1.2)

res.save("images/gray_wall_tile.webp", "WEBP", quality=92, method=6)
print("Готово! Контрастный тайл сохранен.")
