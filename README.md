# YKS Asistanım 🚀

YKS Asistanım, üniversite sınavına hazırlık sürecinde verimliliği artırmak ve sınav hazırlık metriklerini modern bir arayüzle izlemek için geliştirilmiş kişisel bir web platformudur.

## Hakkında
Bu proje, sınav hazırlık sürecindeki karmaşık veri yapısını anlamlandırmak, çalışma programlarını optimize etmek ve performans takibi yapmak amacıyla Emir Aytekin tarafından geliştirilmiştir. Teknoloji ve eğitimin kesişim noktasında modern bir çözüm sunar.

## Temel Özellikler
* **Modern Dashboard:** Sınav hazırlık metriklerinin anlık olarak görselleştirildiği interaktif bir arayüz.
* **Veri Analitiği:** Python ile işlenmiş üniversite ve sınav veri setlerinin, yerel JSON yapısıyla entegrasyonu.
* **Akıllı Planlama:** Çalışma programlarını dinamik olarak yöneten, kullanıcı dostu arayüz tasarımı.
* **Optimizasyon:** Yüksek performanslı veri işleme ve hızlı sayfa yükleme süreleri (SPA mimarisi).

## Teknoloji Yığını
* **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid yapısı), JavaScript (ES6+).
* **Backend/Data:** Python (Veri ayrıştırma ve JSON düzenleme araçları).
* **Tasarım:** FontAwesome ikon setleri ve özelleştirilmiş dashboard bileşenleri.

## Geliştirici
* **Emir Aytekin** - [Yenimahalle Fen Lisesi]

## Veri Kaynağı
Bu projede kullanılan üniversite ve bölüm verileri, [YÖK Atlas](https://yokatlas.yok.gov.tr/) platformundan alınmıştır. Projenin veri doğruluğu ve güncelliği için resmi veriler temel alınmıştır. Veriler 2024 yılları verileridir, verilerde hata olabilir önemli bilgiler için resmi kurumlara bakın.

## Kullanım
**Tablo-Uni.py**: [ÖSYM Kılavuz](https://www.osym.gov.tr/TR,33377/2025-yuksekogretim-kurumlari-sinavi-yks-yuksekogretim-programlari-ve-kontenjanlari-kilavuzu.html) linkindeki excel tablolarını universiteler.json'da lazım olacak verileri senkronize eden python kodu.

**siralama.py**: Senkronize olan verileri "sira" verisine göre artan sırada "id" numaralarını günceller.

**parantez_temizle**: Güncellenen verilerde gereksiz kalan parantez içi verileri siler.

## Lisans
Bu proje "Tüm Hakları Saklıdır" kapsamında korunmaktadır. Detaylar için `LICENSE` dosyasına bakınız.
