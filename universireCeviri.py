import json

def convert_university_data(input_file, output_file):
    # JSON dosyasını oku
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except FileNotFoundError:
        print(f"Hata: '{input_file}' bulunamadı. Lütfen dosyanın aynı klasörde olduğundan emin ol.")
        return
    except json.JSONDecodeError:
        print(f"Hata: '{input_file}' geçerli bir JSON formatında değil.")
        return

    converted_data = []
    # İstenen başlangıç ID'si
    current_id = 318

    # Veri setindeki her bir objeyi dön
    for item in raw_data:
        new_item = {
            "id": current_id,
            "programKodu": item.get("kilavuzKodu", ""),
            "uni": item.get("universiteAdi", ""),
            "fakulte": item.get("fymkAdi", ""),
            "prog": item.get("birimAdi", ""),
            "sehir": item.get("ilAdi", ""),
            "puanTuru": item.get("puanTuru", ""),
            "derece": item.get("birimTuruAdi", ""),
            "uniTuru": item.get("universiteTuru", ""),
            "ucret": "ÜCRETSİZ",
            "ogretimTuru": item.get("ogrenimTuruAdi", ""),
            "dil": item.get("ogrenimDiliAdi", ""),
            "kontenjan": item.get("kontenjan", ""),
            "yerlesen": item.get("kontenjan", ""),
            "bos": "0",
            "doluluk": "%100",
            "sira": item.get("basariSirasi", ""),
            "siraSarti": "",  # Boş bırakılması istendi
            "puan": item.get("minPuan", "")
        }
        
        converted_data.append(new_item)
        current_id += 1 # Sonraki kayıt için ID'yi 1 artır

    # Yeni JSON dosyasını Türkçe karakter bozulması olmadan (ensure_ascii=False) kaydet
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, ensure_ascii=False, indent=4)

    print(f"İşlem başarıyla tamamlandı! Toplam {len(converted_data)} adet kayıt dönüştürüldü ve '{output_file}' dosyasına kaydedildi.")

# Programı çalıştır
input_filename = "yok.json"
output_filename = "universiteler1.json"

convert_university_data(input_filename, output_filename)