import json

# Dosya adını belirtiyoruz. (Dosyanın aynı klasörde olduğundan emin ol)
dosya_adi = "universiteler.json"

try:
    # 1. Mevcut veriyi oku
    with open(dosya_adi, 'r', encoding='utf-8') as f:
        universiteler = json.load(f)
        
    # 2. Her bir sözlüğe (üniversite kaydına) netler bölümünü ekle
    for uni in universiteler:
        # İstenen yapıyı ekliyoruz
        uni["netler"] = {
            "tyt": {},
            "ayt": {}
        }
        
    # 3. Güncellenmiş veriyi tekrar aynı dosyaya yaz
    # ensure_ascii=False ile Türkçe karakterlerin (ş, ı, ğ vb.) bozulmasını engelliyoruz
    with open(dosya_adi, 'w', encoding='utf-8') as f:
        json.dump(universiteler, f, ensure_ascii=False, indent=4)
        
    print("İşlem başarıyla tamamlandı! Tüm kayıtların içine 'netler' yapısı eklendi.")
    
except FileNotFoundError:
    print(f"Hata: '{dosya_adi}' bulunamadı. Lütfen dosya adını ve yolunu kontrol et.")
except json.JSONDecodeError:
    print(f"Hata: '{dosya_adi}' geçerli bir JSON dosyası değil.")
except Exception as e:
    print(f"Beklenmeyen bir hata oluştu: {e}")