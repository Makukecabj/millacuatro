"""
Descarga fotos del Instagram de __millacuatro.
Se conecta a Chrome que ya esta abierto.

EJECUCION:
    python download_photos.py

Chrome tiene que estar abierto y logueado a Instagram.
"""

import json
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright

PROFILE = "__millacuatro"
USER_ID = "49949364315"
MAX_POSTS = 50
OUTPUT_DIR = os.path.join("assets", "productos")
DEBUG_PORT = 9222


def log(msg):
    print(msg, flush=True)


def download(url, filepath):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        with open(filepath, "wb") as f:
            f.write(r.read())


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        log("Conectando a Chrome...")
        try:
            browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{DEBUG_PORT}")
        except Exception:
            log("")
            log("ERROR: No se pudo conectar a Chrome.")
            log("")
            log("Chrome tiene que estar abierto con remote debugging.")
            log("Cerra Chrome y abri el archivo 'abrir_chrome.bat' primero.")
            input(">>> ENTER para cerrar: ")
            return

        ctx = browser.contexts[0]
        page = ctx.new_page()

        log(f"Navegando a {PROFILE}...")
        page.goto(f"https://www.instagram.com/{PROFILE}/", wait_until="domcontentloaded")
        time.sleep(5)

        # Cerrar popups
        for text in ["Not Now", "Not now", "Cancel", "Ahora no"]:
            try:
                btn = page.query_selector(f'button:has-text("{text}")')
                if btn:
                    btn.click()
                    time.sleep(1)
            except Exception:
                pass

        # Pedir posts via feed API (paginado)
        all_images = []
        max_id = ""
        pages_fetched = 0

        log("Pidiendo posts via API...\n")

        while len(all_images) < MAX_POSTS:
            pages_fetched += 1
            url = f"/api/v1/feed/user/{USER_ID}/?count=12&id={USER_ID}"
            if max_id:
                url += f"&max_id={max_id}"

            result = page.evaluate(f"""
                async () => {{
                    const resp = await fetch("{url}", {{
                        credentials: "include",
                        headers: {{
                            "X-IG-App-ID": "936619743392459",
                            "X-Requested-With": "XMLHttpRequest"
                        }}
                    }});
                    return await resp.json();
                }}
            """)

            items = result.get("items", [])
            more = result.get("more_available", False)
            max_id = result.get("next_max_id", "")

            log(f"  Pagina {pages_fetched}: {len(items)} items")

            for item in items:
                media_type = item.get("media_type", 0)

                # Foto simple
                if media_type == 1:
                    candidates = item.get("image_versions2", {}).get("candidates", [])
                    if candidates:
                        url = candidates[0].get("url", "")
                        if url:
                            all_images.append(url)

                # Carrusel
                elif media_type == 8:
                    carousel = item.get("carousel_media", [])
                    for c in carousel:
                        if c.get("media_type") == 1:
                            candidates = c.get("image_versions2", {}).get("candidates", [])
                            if candidates:
                                url = candidates[0].get("url", "")
                                if url:
                                    all_images.append(url)
                                    break

            if not more or not max_id:
                break
            time.sleep(1)

        log(f"\nTotal imagenes: {len(all_images)}")

        if not all_images:
            log("No se obtuvieron imagenes.")
            page.close()
            browser.close()
            return

        # Descargar
        to_download = all_images[:MAX_POSTS]
        log(f"Descargando {len(to_download)} fotos...\n")

        downloaded = 0
        for url in to_download:
            downloaded += 1
            padded = str(downloaded).zfill(2)
            filename = f"producto-{padded}.jpg"
            filepath = os.path.join(OUTPUT_DIR, filename)
            try:
                download(url, filepath)
                size_kb = os.path.getsize(filepath) // 1024
                log(f"  [{downloaded}/{len(to_download)}] {filename} ({size_kb} KB)")
            except Exception as e:
                log(f"  [{downloaded}/{len(to_download)}] Error: {e}")

        page.close()
        browser.close()

    log(f"\nListo! {downloaded} fotos en {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
