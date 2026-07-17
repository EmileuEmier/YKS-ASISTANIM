import json

def idleri_siraya_gore_guncelle(json_dosyasi, yeni_json_dosyasi):
    # JSON dosyasını okuyoruz
    try:
        with open(json_dosyasi, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Hata: '{json_dosyasi}' dosyası bulunamadı. Lütfen dosya adını kontrol edin.")
        return

    # Sıralama mantığını tanımlayan yardımcı fonksiyon
    def siralama_anahtari(item):
        sira = item.get("sira", "-")
        # Eğer sıra bir sayıysa sıralamada en başa koy ve kendi değerine göre sırala (0, sira)
        if isinstance(sira, int):
            return (0, sira)
        # Eğer sıra sayı değilse ("-" ise) sıralamada en sona at (1, sonsuz gibi büyük bir sayı)
        return (1, float('inf'))

    # Verileri tanımladığımız kurala göre sıralıyoruz
    data.sort(key=siralama_anahtari)

    # Sıralanan verilere 1'den başlayarak yeni ID'lerini veriyoruz
    for yeni_id, item in enumerate(data, start=1):
        item["id"] = yeni_id

    # Yeni sıralı veriyi dosyaya geri yazıyoruz
    with open(yeni_json_dosyasi, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"İşlem başarıyla tamamlandı!")
    print(f"Veriler 'sira' değerine göre sıralandı ve yeni ID'ler '{yeni_json_dosyasi}' dosyasına kaydedildi.")

# --- KULLANIM ---
# Önceki koddan çıkan orijinal JSON dosyasının adı
girdi_dosyasi = 'universiteler1.json'

# Yeni üretilecek, ID'leri güncellenmiş dosyanın adı (istersen üzerine de yazdırabilirsin)
cikti_dosyasi = 'universiteler_sirali.json'

idleri_siraya_gore_guncelle(girdi_dosyasi, cikti_dosyasi)