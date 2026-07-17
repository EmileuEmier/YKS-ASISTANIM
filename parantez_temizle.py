import json
import re

def parantezleri_temizle(girdi_dosyasi, cikti_dosyasi):
    try:
        # JSON dosyasını oku
        with open(girdi_dosyasi, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Hata: '{girdi_dosyasi}' bulunamadı.")
        return

    # Verilerin üzerinde tek tek gezin
    for item in data:
        # "uni" değeri varsa parantezleri ve içini sil
        if "uni" in item and isinstance(item["uni"], str):
            # \(.*?\) : Aç Parantez + İçindeki her şey + Kapa Parantez anlamına gelir
            temiz_uni = re.sub(r'\(.*?\)', '', item["uni"])
            # Kalan fazladan boşlukları düzelt (" ".join(...split()) en iyi yöntemdir)
            item["uni"] = " ".join(temiz_uni.split())
            
        # "prog" değeri varsa parantezleri ve içini sil
        if "prog" in item and isinstance(item["prog"], str):
            temiz_prog = re.sub(r'\(.*?\)', '', item["prog"])
            item["prog"] = " ".join(temiz_prog.split())

    # Değişiklikleri yeni JSON dosyasına kaydet
    with open(cikti_dosyasi, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"İşlem tamamlandı! Parantezler ve içindeki yazılar silinerek '{cikti_dosyasi}' dosyasına kaydedildi.")

# --- KULLANIM BÖLÜMÜ ---
# Okunacak mevcut JSON dosyasının adı
json_dosyasi = 'universiteler.json' 

# Temizlenmiş verilerin kaydedileceği yeni dosyanın adı (Aynı dosya adını verirsen üzerine yazar)
yeni_json_dosyasi = 'universiteler_temiz.json'

parantezleri_temizle(json_dosyasi, yeni_json_dosyasi)