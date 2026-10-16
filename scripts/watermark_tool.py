import sys
import os
from PIL import Image

def apply_watermark(image_path, watermark_path, output_path):
    try:
        base_image = Image.open(image_path).convert("RGBA")
        watermark = Image.open(watermark_path).convert("RGBA")

        # Watermark boyutu ana görselin genişliğinin yaklaşık %30'u kadar olsun
        wm_width = int(base_image.width * 0.30)
        # En az 160px, en fazla 600px
        wm_width = max(160, min(wm_width, 600))
        aspect_ratio = watermark.height / watermark.width
        wm_height = int(wm_width * aspect_ratio)

        watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)

        # Sağ üst köşeye konumlandır (padding: görsel genişliğinin %3'ü)
        padding_x = max(15, int(base_image.width * 0.03))
        padding_y = max(15, int(base_image.height * 0.03))
        position = (base_image.width - wm_width - padding_x, padding_y)

        # Şeffaflığı koruyarak yerleştir
        transparent_layer = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
        transparent_layer.paste(watermark, position, mask=watermark)

        combined = Image.alpha_composite(base_image, transparent_layer)
        
        # Orijinal uzantısına göre kaydet (jpg ise RGB'ye çevir)
        ext = os.path.splitext(output_path)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            combined = combined.convert("RGB")
            combined.save(output_path, quality=92)
        else:
            combined.save(output_path, 'PNG')

        return True
    except Exception as e:
        print(f"Filigran eklenirken hata: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Kullanim: python watermark_tool.py <gorsel_yolu> <watermark_yolu> <cikti_yolu>")
        sys.exit(1)

    img_path = sys.argv[1]
    wm_path = sys.argv[2]
    out_path = sys.argv[3]

    success = apply_watermark(img_path, wm_path, out_path)
    if not success:
        sys.exit(1)
