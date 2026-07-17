import json
import openpyxl

# BURAYA KENDİ ŞEHİRLER LİSTENİZİ YAPIŞTIRIN
# Örnek: SEHIRLER = ["ADANA", "ANKARA", "İSTANBUL", "İZMİR", "TRABZON", ...]
SEHIRLER = [
    "ADANA",
    "ADIYAMAN",
    "AFYON",
    "AĞRI",
    "AKSARAY",
    "AMASYA",
    "ANKARA",
    "ANTALYA",
    "ARDAHAN",
    "ARTVİN",
    "AYDIN",
    "BALIKESİR",
    "BARTIN",
    "BATMAN",
    "BAYBURT",
    "BİLECİK",
    "BİNGÖL",
    "BİTLİS",
    "BOLU",
    "BURDUR",
    "BURSA",
    "ÇANAKKALE",
    "ÇANKIRI",
    "ÇORUM",
    "DENİZLİ",
    "DİYARBAKIR",
    "DÜZCE",
    "EDİRNE",
    "ELAZIĞ",
    "ERZİNCAN",
    "ERZURUM",
    "ESKİŞEHİR",
    "GAZİANTEP",
    "GİRESUN",
    "GÜMÜŞHANE",
    "HAKKARİ",
    "HATAY",
    "IĞDIR",
    "ISPARTA",
    "İSTANBUL",
    "İZMİR",
    "KAHRAMANMARAŞ",
    "KARABÜK",
    "KARAMAN",
    "KARS",
    "KASTAMONU",
    "KAYSERİ",
    "KIRIKKALE",
    "KIRKLARELİ",
    "KIRŞEHİR",
    "KİLİS",
    "KOCAELİ",
    "KONYA",
    "KÜTAHYA",
    "MALATYA",
    "MANİSA",
    "MARDİN",
    "MERSİN",
    "MUĞLA",
    "MUŞ",
    "NEVŞEHİR",
    "NİĞDE",
    "ORDU",
    "OSMANİYE",
    "RİZE",
    "SAKARYA",
    "SAMSUN",
    "SİİRT",
    "SİNOP",
    "SİVAS",
    "ŞANLIURFA",
    "ŞIRNAK",
    "TEKİRDAĞ",
    "TOKAT",
    "TRABZON",
    "TUNCELİ",
    "UŞAK",
    "VAN",
    "YALOVA",
    "YOZGAT",
    "ZONGULDAK",
    "BİŞKEK",
    "KİEV",
    "MOSKOVA",
    "TİFLİS",
    "LEFKOŞA",
    "KAHİRE",
    "BAKÜ",
    "TÜRKİSTAN",
    "ALMATI",
    "SARAYBOSNA",
    "ÜSKÜP",
    "GOSTİVAR",
    "KOMRAT",
    "GİRNE",
    "GÜZELYURT",
    "LEFKE",
    "GEBZE",
    "GAZİMAĞUSA",
    "İÇİŞLERİ BAKANLIĞI",
    "GÜZELYURT",
    "TİRAN"
]

def excelden_jsona_cevir(excel_dosyasi, json_dosyasi):
    # Excel dosyasını veri modunda açıyoruz (formülleri değil değerleri okumak için)
    wb = openpyxl.load_workbook(excel_dosyasi, data_only=True)
    sheet = wb.active

    data = []
    current_id = 1

    # Hafızada tutulacak üst başlık değişkenleri
    current_uni = ""
    current_sehir = ""
    current_uni_turu = ""
    current_fakulte = ""
    current_akreditasyon = "-"

    # Bütün satırları listeye alıyoruz ki bir sonraki satırı (next_row) kontrol edebilelim
    rows = list(sheet.iter_rows(values_only=True))

    # Hücre verisini güvenli bir şekilde çekmek için yardımcı fonksiyon
    def get_val(row, index):
        if row and index < len(row):
            val = row[index]
            return str(val).strip() if val is not None else ""
        return ""

    for i in range(len(rows)):
        row = rows[i]
        next_row = rows[i+1] if i + 1 < len(rows) else None

        # A sütunu (0. indeks) program kodunu içerir
        col_a = get_val(row, 0)
        next_col_a = get_val(next_row, 0)

        # A sütununda sadece rakamlardan oluşan bir değer varsa bu bir programdır
        is_prog = col_a.replace(' ', '').isdigit() if col_a else False
        next_is_prog = next_col_a.replace(' ', '').isdigit() if next_col_a else False

        # --- 1. ÜNİVERSİTE SATIRI KONTROLÜ (Kırmızı Fontlu Satır) ---
        # Şu anki satırda program kodu yok VE altındaki satırda da program kodu yoksa
        if not is_prog and not next_is_prog:
            # Üniversite adının B sütununda (veya birleşik hücreden dolayı A'da) olma ihtimaline karşı
            text = get_val(row, 1) or get_val(row, 0)
            if not text:
                continue

            # Üniversite Türünü Belirleme
            turler = ["DEVLET", "YURTDIŞI VAKIF", "VAKIF MYO", "VAKIF", "KKTC"]
            current_uni_turu = "DEVLET" # Bulunamazsa varsayılan
            for tur in turler:
                if tur in text.upper():
                    current_uni_turu = tur
                    break

            # Şehri Belirleme (Şehirler listesinden kontrol)
            current_sehir = ""
            for sehir in SEHIRLER:
                if sehir.upper() in text.upper():
                    current_sehir = sehir.upper()
                    break

            # Üniversite adından tür yazısını çıkartıp temizliyoruz (Örn: " - DEVLET" kısmını atıyoruz)
            current_uni = text.replace(current_uni_turu, "").strip()
            if current_uni.endswith("-"):
                current_uni = current_uni[:-1].strip()

            # Üniversite satırının S sütunundan (18. indeks) akreditasyonu al, boşsa "-" yap
            uni_s_col = get_val(row, 18)
            current_akreditasyon = uni_s_col if uni_s_col else "-"

        # --- 2. FAKÜLTE SATIRI KONTROLÜ (Kalın Fontlu Satır) ---
        # Şu anki satırda program kodu yok AMA altındaki satırda program kodu varsa
        elif not is_prog and next_is_prog:
            current_fakulte = get_val(row, 1) # B sütunundaki veri

        # --- 3. PROGRAM SATIRI KONTROLÜ ---
        # Şu anki satırda program kodu varsa
        elif is_prog:
            prog_kodu = int(col_a)
            prog_ad = get_val(row, 1) # B Sütunu
            prog_upper = prog_ad.upper()

            # Programın kendi S sütununa (18. indeks) bakıyoruz
            prog_s_col = get_val(row, 18)
            
            # Eğer programın kendi S sütunu doluysa onu yaz, boşsa üniversiteninkini yaz
            akreditasyon_degeri = prog_s_col if prog_s_col else current_akreditasyon

            # B sütunundaki metinden Ücret, Öğretim Türü ve Dil tespiti
            ucret = "ÜCRETSİZ"
            if "ÜCRETLİ" in prog_upper: ucret = "ÜCRETLİ"
            elif "BURSLU" in prog_upper: ucret = "BURSLU"
            elif "%25" in prog_upper: ucret = "%25 İNDİRİMLİ"
            elif "%50" in prog_upper: ucret = "%50 İNDİRİMLİ"

            ogretim_turu = "Örgün Öğretim"
            if "UOLP" in prog_upper: ogretim_turu = "UOLP"
            elif "UZAKTAN ÖĞRETİM" in prog_upper: ogretim_turu = "Uzaktan Öğretim"
            elif "AÇIK ÖĞRETİM" in prog_upper: ogretim_turu = "Açık Öğretim"

            dil = "Türkçe"
            if "İNGİLİZCE" in prog_upper: dil = "İngilizce"
            elif "İngilizce" in prog_ad: dil = "İngilizce"
            elif "FRANSIZCA" in prog_upper: dil = "Fransızca"
            elif "Fransızca" in prog_ad: dil = "Fransızca"
            elif "ALMANCA" in prog_upper: dil = "Almanca"
            elif "Almanca" in prog_ad: dil = "Almanca"
            elif "ÇİNCE" in prog_upper: dil = "Çince"
            elif "Çince" in prog_ad: dil = "Çince"
            elif "RUSÇA" in prog_upper: dil = "Rusça"
            elif "Rusça" in prog_ad: dil = "Rusça"

            # E Sütunu Kontenjan
            kontenjan_str = get_val(row, 4)
            kontenjan = int(kontenjan_str) if kontenjan_str.isdigit() else kontenjan_str

            # L Sütunu (Sıra / Doluluk Oranı İçin Referans)
            col_l = get_val(row, 11)
            l_dolu_mu = bool(col_l and col_l != "-")

            if l_dolu_mu:
                yerlesen = kontenjan
                bos = "0"
                doluluk = "%100"
            else:
                yerlesen = "-"
                bos = "-"
                doluluk = "Dolmamış"

            # M sütunundaki Puan (Virgülleri noktaya çevirerek float formatına alıyoruz)
            puan_str = get_val(row, 12).replace(',', '.').strip()
            try:
                puan = float(puan_str)
            except ValueError:
                # Eğer "----", "Dolmadı", boşluk veya dönüştürülemeyen herhangi bir metin varsa "-" yap
                puan = "-"

            # L sütunundaki Sıra (Tam sayıya çeviriyoruz)
            sira = int(col_l) if col_l.isdigit() else "-"

            # JSON Objesini oluşturma
            item = {
                "id": current_id,
                "programKodu": prog_kodu,
                "uni": current_uni,
                "fakulte": current_fakulte,
                "akreditasyon": akreditasyon_degeri,
                "prog": prog_ad,
                "sehir": current_sehir,
                "puanTuru": get_val(row, 3), # D sütunu
                "derece": get_val(row, 2),   # C sütunu
                "uniTuru": current_uni_turu,
                "ucret": ucret,
                "ogretimTuru": ogretim_turu,
                "dil": dil,
                "kontenjan": kontenjan,
                "yerlesen": yerlesen,
                "bos": bos,
                "doluluk": doluluk,
                "sira": sira,
                "siraSarti": get_val(row, 2), # C sütunu
                "puan": puan,
                "netler": {"tyt": {}, "ayt": {}}
            }

            data.append(item)
            current_id += 1

    # Hazırlanan listeyi JSON dosyası olarak yazdırma
    with open(json_dosyasi, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"İşlem tamamlandı! Toplam {len(data)} program '{json_dosyasi}' dosyasına başarıyla kaydedildi.")

# --- KULLANIM BÖLÜMÜ ---
# Excel dosyanızın adı (Örn: 'yks_tablo.xlsx')
excel_dosya_adi = '2.xlsx' 
# Çıktı alınacak JSON dosyasının adı
json_ciktisi_adi = 'universiteler2.json'

excelden_jsona_cevir(excel_dosya_adi, json_ciktisi_adi)