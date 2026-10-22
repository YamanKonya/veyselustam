"""Run one Qwen-Image-Edit-2509 edit through the local ComfyUI API (free, runs on this PC).

Setup (once): ComfyUI portable in C:/Users/ROGSTRIX/ComfyUI_windows_portable with the
ComfyUI-GGUF node and these models:
  models/unet/Qwen-Image-Edit-2509-Q3_K_M.gguf
  models/text_encoders/Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf (+ Qwen2.5-VL-7B-Instruct-mmproj-F16.gguf)
  models/vae/qwen_image_vae.safetensors
  models/loras/Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors
Start the server: python_embeded/python.exe -s ComfyUI/main.py --windows-standalone-build
  --listen 127.0.0.1 --port 8188 --lowvram --disable-auto-launch

Usage: python -P qwen_edit.py <input.jpg> <output.png> "<prompt>" [seed] [steps] [denoise]
  denoise < 1 (e.g. 0.3) keeps the input geometry and only harmonises light and detail.
"""
import io, json, sys, time, uuid, urllib.error, urllib.request
from PIL import Image, ImageOps

URL = "http://127.0.0.1:8188"


def edit(src, out, prompt, seed=7, steps=4, denoise=1.0):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    buf = io.BytesIO()
    im.save(buf, "PNG")
    boundary = uuid.uuid4().hex
    name = f"in_{uuid.uuid4().hex[:8]}.png"
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode()
        + buf.getvalue()
        + f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n'.encode()
    )
    req = urllib.request.Request(f"{URL}/upload/image", data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    uploaded = json.load(urllib.request.urlopen(req))["name"]

    g = {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "Qwen-Image-Edit-2509-Q3_K_M.gguf"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors", "strength_model": 1.0}},
        "3": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["2", 0], "shift": 3.0}},
        "4": {"class_type": "CFGNorm", "inputs": {"model": ["3", 0], "strength": 1.0}},
        "5": {"class_type": "CLIPLoaderGGUF", "inputs": {"clip_name": "Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf", "type": "qwen_image"}},
        "6": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "7": {"class_type": "LoadImage", "inputs": {"image": uploaded}},
        "8": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["7", 0], "upscale_method": "lanczos", "megapixels": 1.0, "resolution_steps": 16}},
        "9": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["5", 0], "vae": ["6", 0], "image1": ["8", 0], "prompt": prompt}},
        "10": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["5", 0], "vae": ["6", 0], "image1": ["8", 0], "prompt": ""}},
        "11": {"class_type": "VAEEncode", "inputs": {"pixels": ["8", 0], "vae": ["6", 0]}},
        "12": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["9", 0], "negative": ["10", 0], "latent_image": ["11", 0],
                "seed": seed, "steps": steps, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": denoise}},
        "13": {"class_type": "VAEDecode", "inputs": {"samples": ["12", 0], "vae": ["6", 0]}},
        "14": {"class_type": "SaveImage", "inputs": {"images": ["13", 0], "filename_prefix": "ai_scene"}},
    }
    req = urllib.request.Request(f"{URL}/prompt", data=json.dumps({"prompt": g}).encode(), headers={"Content-Type": "application/json"})
    try:
        pid = json.load(urllib.request.urlopen(req))["prompt_id"]
    except urllib.error.HTTPError as e:
        raise SystemExit("prompt rejected: " + e.read().decode()[:2000])

    t0 = time.time()
    while time.time() - t0 < 1500:
        time.sleep(3)
        h = json.load(urllib.request.urlopen(f"{URL}/history/{pid}"))
        if pid not in h:
            continue
        st = h[pid].get("status", {})
        if st.get("status_str") == "error":
            raise SystemExit("error: " + json.dumps(st.get("messages", []))[:2000])
        imgs = h[pid]["outputs"].get("14", {}).get("images", [])
        if imgs:
            i = imgs[0]
            data = urllib.request.urlopen(f"{URL}/view?filename={i['filename']}&subfolder={i['subfolder']}&type={i['type']}").read()
            open(out, "wb").write(data)
            return time.time() - t0
    raise SystemExit("timeout")


if __name__ == "__main__":
    a = sys.argv[1:]
    secs = edit(a[0], a[1], a[2], int(a[3]) if len(a) > 3 else 7, int(a[4]) if len(a) > 4 else 4,
                float(a[5]) if len(a) > 5 else 1.0)
    print(f"done in {secs:.0f}s -> {a[1]}")
