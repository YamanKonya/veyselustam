"""Image-to-video with Wan 2.2 I2V A14B (Apache 2.0) through the local ComfyUI API.

Models (ComfyUI/models):
  unet/Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf, unet/Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf
  loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors (+ _low_noise)
  text_encoders/umt5-xxl-encoder-Q5_K_M.gguf, vae/wan_2.1_vae.safetensors
Start ComfyUI first (see scripts/ai_scenes/qwen_edit.py).

Usage: python -P wan_i2v.py <start.jpg> <out.mp4> "<prompt>" [--size 640] [--frames 81] [--seed 1]
"""
import io, json, os, shutil, subprocess, sys, tempfile, time, uuid, urllib.error, urllib.request
from PIL import Image, ImageOps

URL = "http://127.0.0.1:8188"
FFMPEG = shutil.which("ffmpeg") or "C:/Users/ROGSTRIX/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"
NEGATIVE = ("blurry, low quality, jpeg artifacts, distorted, deformed ring, melting metal, warped stone, "
            "hands, fingers, text, watermark, logo, flicker, static frame, cartoon, oversaturated")


def opt(args, name, default):
    return type(default)(args[args.index(name) + 1]) if name in args else default


def upload(path, size):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im = ImageOps.fit(im, (size, size), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    b = uuid.uuid4().hex
    name = f"wan_{uuid.uuid4().hex[:8]}.png"
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode()
            + buf.getvalue() + f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode())
    req = urllib.request.Request(f"{URL}/upload/image", data=body, headers={"Content-Type": f"multipart/form-data; boundary={b}"})
    return json.load(urllib.request.urlopen(req))["name"]


def run(start, out, prompt, size=640, frames=81, seed=1):
    img = upload(start, size)
    g = {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "Wan2.2-I2V-A14B-HighNoise-Q3_K_M.gguf"}},
        "2": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "Wan2.2-I2V-A14B-LowNoise-Q3_K_M.gguf"}},
        "3": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors", "strength_model": 1.0}},
        "4": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["2", 0], "lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors", "strength_model": 1.0}},
        "5": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["3", 0], "shift": 5.0}},
        "6": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["4", 0], "shift": 5.0}},
        "7": {"class_type": "CLIPLoaderGGUF", "inputs": {"clip_name": "umt5-xxl-encoder-Q5_K_M.gguf", "type": "wan"}},
        "8": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["7", 0], "text": prompt}},
        "9": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["7", 0], "text": NEGATIVE}},
        "10": {"class_type": "VAELoader", "inputs": {"vae_name": "wan_2.1_vae.safetensors"}},
        "11": {"class_type": "LoadImage", "inputs": {"image": img}},
        "12": {"class_type": "WanImageToVideo", "inputs": {"positive": ["8", 0], "negative": ["9", 0], "vae": ["10", 0], "start_image": ["11", 0],
                "width": size, "height": size, "length": frames, "batch_size": 1}},
        "13": {"class_type": "KSamplerAdvanced", "inputs": {"model": ["5", 0], "positive": ["12", 0], "negative": ["12", 1], "latent_image": ["12", 2],
                "add_noise": "enable", "noise_seed": seed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
                "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable"}},
        "14": {"class_type": "KSamplerAdvanced", "inputs": {"model": ["6", 0], "positive": ["12", 0], "negative": ["12", 1], "latent_image": ["13", 0],
                "add_noise": "disable", "noise_seed": seed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
                "start_at_step": 2, "end_at_step": 10000, "return_with_leftover_noise": "disable"}},
        "15": {"class_type": "VAEDecode", "inputs": {"samples": ["14", 0], "vae": ["10", 0]}},
        "17": {"class_type": "SaveImage", "inputs": {"images": ["15", 0], "filename_prefix": f"wan/{uuid.uuid4().hex[:8]}"}},
    }
    req = urllib.request.Request(f"{URL}/prompt", data=json.dumps({"prompt": g}).encode(), headers={"Content-Type": "application/json"})
    try:
        pid = json.load(urllib.request.urlopen(req))["prompt_id"]
    except urllib.error.HTTPError as e:
        raise SystemExit("prompt rejected: " + e.read().decode()[:3000])
    t0 = time.time()
    while time.time() - t0 < 5400:
        time.sleep(5)
        h = json.load(urllib.request.urlopen(f"{URL}/history/{pid}"))
        if pid not in h:
            continue
        st = h[pid].get("status", {})
        if st.get("status_str") == "error":
            raise SystemExit("error: " + json.dumps(st.get("messages", []))[:3000])
        files = h[pid]["outputs"].get("17", {}).get("images", [])
        if files:
            # Frames come back as PNGs; join them into an H.264 MP4 at 16 fps
            tmp = tempfile.mkdtemp(prefix="wan_")
            for n, f in enumerate(files):
                data = urllib.request.urlopen(f"{URL}/view?filename={f['filename']}&subfolder={f.get('subfolder', '')}&type={f.get('type', 'output')}").read()
                open(os.path.join(tmp, f"{n:04d}.png"), "wb").write(data)
            subprocess.run([FFMPEG, "-v", "error", "-y", "-framerate", "16", "-i", os.path.join(tmp, "%04d.png"),
                            "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", out], check=True)
            shutil.rmtree(tmp, ignore_errors=True)
            return time.time() - t0
    raise SystemExit("timeout")


if __name__ == "__main__":
    a = sys.argv[1:]
    secs = run(a[0], a[1], a[2], opt(a, "--size", 640), opt(a, "--frames", 81), opt(a, "--seed", 1))
    print(f"done in {secs:.0f}s -> {a[1]}")
