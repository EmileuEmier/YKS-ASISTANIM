// Eski hali (Hatalı):
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";

// Yeni hali (Doğru):
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
// Firestore import satırını bu şekilde güncelle:
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
// Auth için import satırını şu şekilde güncelle:
// Auth için import satırını şu şekilde güncelle:
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUatB-qKrdPzzNoI6h1vOostNwjpzANb4",
  authDomain: "yks-asistanim-4ddbc.firebaseapp.com",
  databaseURL: "https://yks-asistanim-4ddbc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yks-asistanim-4ddbc",
  storageBucket: "yks-asistanim-4ddbc.firebasestorage.app",
  messagingSenderId: "530208653555",
  appId: "1:530208653555:web:b6d74bd3a91fd43057f786",
  measurementId: "G-02W8BDM41T"
};

// Uygulamayı ve servisleri başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Kullanıcı ID'sini globalde tanımla
let aktifKullaniciId = null;    

// Kullanıcı giriş durumunu dinle
onAuthStateChanged(auth, async (user) => {
    if (user) {
        aktifKullaniciId = user.uid; // Kullanıcının benzersiz ID'si
        await kullaniciVerileriniGetir(aktifKullaniciId);
    } else {
        // Yönlendirme iptal edildi.
        // Kullanıcı giriş yapmamışsa sayfanın en altındaki DOMContentLoaded
        // içindeki listener zaten auth-modal'ı (popup'ı) açacaktır.
        aktifKullaniciId = null; 
    }
});

// Firebase'den Veri Çekme Fonksiyonu
async function kullaniciVerileriniGetir(uid) {
    const userRef = doc(db, "kullanicilar", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        tumDenemeler = data.denemeler || [];
        tercihListem = data.tercihler || [];
        hedefler = data.hedefler || [];
    } else {
        // Kullanıcı sisteme ilk kez kayıt olmuşsa ve belgesi yoksa boş belge oluştur
        await setDoc(userRef, { denemeler: [], tercihler: [], hedefler: [] });
    }

    // VERİLER GELDİKTEN SONRA ARAYÜZÜ GÜNCELLE
    // (Daha önce bu fonksiyonlar en altta sayfa yüklenirken çalışıyordu, 
    // artık veriler Firebase'den geldikten sonra çalışmalılar)
    verileriGuncelle();
    document.getElementById('tercih-count').textContent = tercihListem.length;
    if(gosterSadeceListem) filterData(); // Tercih robotu tablosunu listeye göre güncelle
    hedefleriCiz();
}

// --- 1. SAYFA GEÇİŞ (SPA) MANTIĞI ---
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Tüm butonlardan active sınıfını kaldır
        navButtons.forEach(b => b.classList.remove('active'));
        // Tıklanan butona active sınıfı ekle
        btn.classList.add('active');

        // Hedef sayfayı bul (data-target üzerinden)
        const targetId = btn.getAttribute('data-target');

        // Tüm sayfaları gizle
        pages.forEach(page => page.classList.remove('active'));
        // Sadece hedef sayfayı göster
        document.getElementById(targetId).classList.add('active');
    });
});

// --- 2. GELİŞMİŞ NET TAKİBİ VE GRAFİK SİSTEMİ ---

let tumDenemeler = [];

// Müfredata 'soru' (Soru Sayısı) özelliği eklendi (Doğru/Yanlış sınırı için)
const sinavMufredati = {
    "TYT": [
        { id: "tr", ad: "Türkçe", renk: "#ef4444", soru: 40 },
        { id: "mat", ad: "Matematik", renk: "#3b82f6", soru: 40 },
        { id: "sos", ad: "Sosyal", renk: "#f59e0b", soru: 20 },
        { id: "fen", ad: "Fen", renk: "#10b981", soru: 20 }
    ],
    "AYT_SAY": [
        { id: "mat", ad: "Matematik", renk: "#3b82f6", soru: 40 },
        { id: "fiz", ad: "Fizik", renk: "#8b5cf6", soru: 14 },
        { id: "kim", ad: "Kimya", renk: "#ec4899", soru: 13 },
        { id: "biy", ad: "Biyoloji", renk: "#10b981", soru: 13 }
    ],
    "AYT_EA": [
        { id: "mat", ad: "Matematik", renk: "#3b82f6", soru: 40 },
        { id: "edeb", ad: "Edebiyat", renk: "#ef4444", soru: 24 },
        { id: "tar1", ad: "Tarih-1", renk: "#f59e0b", soru: 10 },
        { id: "cog1", ad: "Coğrafya-1", renk: "#10b981", soru: 6 }
    ],
    "AYT_SOZ": [
        { id: "edeb", ad: "Edebiyat", renk: "#ef4444", soru: 24 },
        { id: "tar1", ad: "Tarih-1", renk: "#f59e0b", soru: 10 },
        { id: "cog1", ad: "Coğrafya-1", renk: "#10b981", soru: 6 },
        { id: "tar2", ad: "Tarih-2", renk: "#d97706", soru: 11 },
        { id: "cog2", ad: "Coğrafya-2", renk: "#059669", soru: 11 },
        { id: "fel", ad: "Felsefe Grubu", renk: "#8b5cf6", soru: 12 },
        { id: "din", ad: "Din Kültürü", renk: "#ec4899", soru: 6 }
    ],
    "YDT": [
        { id: "dil", ad: "Yabancı Dil", renk: "#3b82f6", soru: 80 }
    ]
};

// Global Grafik Değişkenleri
let toplamChartInstance = null;
let dersChartInstance = null;
let siralamaChartInstance = null;

// DOM Elementleri
const selectSinavTuru = document.getElementById('nt-sinav-turu');
const derslerContainer = document.getElementById('nt-dersler-container');
const checkSiralama = document.getElementById('nt-siralama-check');
const divSiralama = document.getElementById('nt-siralama-inputs');

let duzenlenenDenemeId = null; // Düzenleme işlemi için hafıza

// 1. Arayüzü Seçilen Sınava Göre Oluşturma
function arayuzuOlustur(sinavTuru) {
    const dersler = sinavMufredati[sinavTuru];
    let html = `
        <div class="dy-row-header">
            <div>Ders</div>
            <div>D</div>
            <div>Y</div>
            <div>Net</div>
        </div>
    `;

    dersler.forEach(ders => {
        html += `
            <div class="dy-row">
                <label title="${ders.soru} Soru">${ders.ad}</label>
                <input type="number" class="dy-input calc-d" data-ders="${ders.id}" data-max="${ders.soru}" placeholder="0" min="0" max="${ders.soru}">
                <input type="number" class="dy-input calc-y" data-ders="${ders.id}" data-max="${ders.soru}" placeholder="0" min="0" max="${ders.soru}">
                <div class="dy-net-box" id="net-${ders.id}">0.00</div>
            </div>
        `;
    });

    derslerContainer.innerHTML = html;
    
    // Validasyon ve Hesaplama Dinleyicileri
    document.querySelectorAll('.calc-d, .calc-y').forEach(input => {
        input.addEventListener('input', function() {
            girdiKontrol(this); // Soru sayısı kontrolü
            netHesapla(this); // Net hesaplama
        });
    });

    document.getElementById('chart-title-type').textContent = selectSinavTuru.options[selectSinavTuru.selectedIndex].text;
    verileriGuncelle();
}

// 2. Girdi Validasyonu (Doğru/Yanlış sayısı soru sayısını geçemez)
function girdiKontrol(input) {
    const row = input.closest('.dy-row');
    
    // Sınıf adından bağımsız olarak, satırın içindeki ilk iki sayı inputunu seçeriz
    const inputs = row.querySelectorAll('input[type="number"]');
    const dInput = inputs[0];
    const yInput = inputs[1];
    const maxSoru = parseInt(input.getAttribute('data-max'));

    if (!dInput || !yInput) return; // Güvenlik kontrolü

    let dVal = parseInt(dInput.value) || 0;
    let yVal = parseInt(yInput.value) || 0;

    if (dVal < 0) { dInput.value = 0; dVal = 0; }
    if (yVal < 0) { yInput.value = 0; yVal = 0; }

    if (dVal > maxSoru) { dInput.value = maxSoru; dVal = maxSoru; }
    if (yVal > maxSoru) { yInput.value = maxSoru; yVal = maxSoru; }

    if (dVal + yVal > maxSoru) {
        // Eğer kullanıcı doğru sayısını değiştiriyorsa yanlışı kısar, tersi durumda doğruyu kısar
        if (input === dInput) {
            yInput.value = maxSoru - dVal;
        } else {
            dInput.value = maxSoru - yVal;
        }
    }
}

// 3. Net Hesaplama
function netHesapla(inputElement) {
    const row = inputElement.closest('.dy-row');
    const dVal = parseFloat(row.querySelector('.calc-d').value) || 0;
    const yVal = parseFloat(row.querySelector('.calc-y').value) || 0;
    const netBox = row.querySelector('.dy-net-box');
    
    let net = dVal - (yVal / 4);
    netBox.textContent = net.toFixed(2);
}

checkSiralama.addEventListener('change', function() { divSiralama.style.display = this.checked ? 'flex' : 'none'; });
selectSinavTuru.addEventListener('change', (e) => { arayuzuOlustur(e.target.value); });

// 4. Tahmini Puan Hesaplama Sistemi (Basit YKS Tahmini)
function tahminiPuanHesapla(sinavTuru, toplamNet) {
    let tabanPuan = 100;
    let tahminiPuan = tabanPuan;
    
    // Katsayılar gerçeğe yaklaşık olarak sabit alınmıştır (ÖSYM'ye göre her yıl değişir)
    if(sinavTuru === "TYT") {
        tahminiPuan += (toplamNet * 3.3); // Ortalama TYT Soru Getirisi
    } else {
        // AYT için: TYT etkisi olmadan salt alan puanı tahmini (Örn: 100 + Alan Neti * 3)
        tahminiPuan += (toplamNet * 3.0); 
    }
    return tahminiPuan > 500 ? 500 : tahminiPuan.toFixed(2); // Max ham puan 500
}

// 5. Veri Kaydetme
document.getElementById('btn-net-kaydet').addEventListener('click', () => {
    const sinavTuru = selectSinavTuru.value;
    const ad = document.getElementById('nt-deneme-adi').value || "İsimsiz Deneme";
    let tarih = document.getElementById('nt-tarih').value || new Date().toISOString().split('T')[0];

    const dersSonuclari = {};
    let toplamNet = 0;

    derslerContainer.querySelectorAll('.dy-row').forEach(row => {
        const dersId = row.querySelector('.calc-d').getAttribute('data-ders');
        const d = parseFloat(row.querySelector('.calc-d').value) || 0;
        const y = parseFloat(row.querySelector('.calc-y').value) || 0;
        const net = parseFloat(row.querySelector('.dy-net-box').textContent) || 0;
        dersSonuclari[dersId] = { d, y, net };
        toplamNet += net;
    });

    const denemeVerisi = {
        id: Date.now(), sinavTuru, ad, tarih, dersler: dersSonuclari, toplamNet
    };

    if (checkSiralama.checked) {
        denemeVerisi.siralama = {
            sinif: document.getElementById('nt-sinif-sira').value || "",
            okul: document.getElementById('nt-okul-sira').value || "",
            genel: document.getElementById('nt-genel-sira').value || ""
        };
    }

    tumDenemeler.push(denemeVerisi);
    firebaseVerileriKaydet();

    // Formu Temizle
    document.getElementById('nt-deneme-adi').value = '';
    document.querySelectorAll('.calc-d, .calc-y').forEach(i => i.value = '');
    document.querySelectorAll('.dy-net-box').forEach(b => b.textContent = '0.00');
    checkSiralama.checked = false; divSiralama.style.display = 'none';

    verileriGuncelle();
});

// 6. Grafikleri ve Listeyi Çizme
function verileriGuncelle() {
    const seciliTur = selectSinavTuru.value;
    const filtrelenmis = tumDenemeler.filter(d => d.sinavTuru === seciliTur).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    grafikleriCiz(filtrelenmis, seciliTur);
    gecmisListesiniCiz(filtrelenmis);
}

// GRAFİK MOTORU
function grafikleriCiz(veriListesi, sinavTuru) {
    const etiketler = veriListesi.map(d => `${d.ad} (${d.tarih.split('-').reverse().join('.')})`);
    
    // 1. TOPLAM NET GRAFİĞİ
    if (toplamChartInstance) toplamChartInstance.destroy();
    toplamChartInstance = new Chart(document.getElementById('toplamNetChart'), {
        type: 'line', data: { labels: etiketler, datasets: [{ label: 'Toplam Net', data: veriListesi.map(d => d.toplamNet), borderColor: '#ccff00', backgroundColor: 'rgba(204, 255, 0, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, grid:{color:'#2d333b'}, ticks:{color:'#9ca3af'} }, x: { grid:{display:false}, ticks:{color:'#9ca3af'} } }, plugins: { legend:{labels:{color:'#9ca3af'}} } }
    });

    // 2. DERS BAZLI ÇOKLU ÇİZGİ GRAFİĞİ
    if (dersChartInstance) dersChartInstance.destroy();
    const datasetsDers = sinavMufredati[sinavTuru].map(ders => ({
        label: ders.ad, data: veriListesi.map(d => d.dersler[ders.id]?.net || 0), borderColor: ders.renk, tension: 0.3
    }));
    dersChartInstance = new Chart(document.getElementById('dersNetChart'), {
        type: 'line', data: { labels: etiketler, datasets: datasetsDers },
        options: { responsive: true, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, grid:{color:'#2d333b'}, ticks:{color:'#9ca3af'} }, x: { grid:{display:false}, ticks:{color:'#9ca3af'} } }, plugins: { legend:{labels:{color:'#9ca3af'}} } }
    });

    // 3. SIRALAMA GRAFİĞİ (YENİ)
    const siralamaVerileri = veriListesi.filter(d => d.siralama && (d.siralama.sinif || d.siralama.okul || d.siralama.genel));
    const siralamaKapsayici = document.getElementById('siralama-kapsayici');
    
    if(siralamaVerileri.length > 0) {
        siralamaKapsayici.style.display = 'block';
        if (siralamaChartInstance) siralamaChartInstance.destroy();
        
        const etiketlerSira = siralamaVerileri.map(d => d.ad);
        siralamaChartInstance = new Chart(document.getElementById('siralamaChart'), {
            type: 'line',
            data: {
                labels: etiketlerSira,
                datasets: [
                    { label: 'Sınıf', data: siralamaVerileri.map(d => d.siralama.sinif || null), borderColor: '#ec4899', tension: 0.3, spanGaps: true },
                    { label: 'Okul', data: siralamaVerileri.map(d => d.siralama.okul || null), borderColor: '#3b82f6', tension: 0.3, spanGaps: true },
                    { label: 'Genel', data: siralamaVerileri.map(d => d.siralama.genel || null), borderColor: '#10b981', tension: 0.3, spanGaps: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { 
                        reverse: true, // SIRALAMA OLDUĞU İÇİN 1. OLAN ÜSTTE GÖRÜNMELİ
                        beginAtZero: false, grid:{color:'#2d333b'}, ticks:{color:'#9ca3af'} 
                    }, 
                    x: { grid:{display:false}, ticks:{color:'#9ca3af'} }
                }, 
                plugins: { legend:{labels:{color:'#9ca3af'}} }
            }
        });
    } else {
        siralamaKapsayici.style.display = 'none';
    }
}

// 7. GEÇMİŞ DENEMELER VE KART TIKLAMA (Detay & Düzenle Modalı)
function gecmisListesiniCiz(veriListesi) {
    const container = document.getElementById('history-list');
    container.innerHTML = '';
    if(veriListesi.length === 0) return;

    [...veriListesi].reverse().forEach(deneme => {
        const div = document.createElement('div');
        div.className = 'history-card';
        // Tıklanınca detayı aç
        div.onclick = () => denemeDetayGoster(deneme.id);
        
        div.innerHTML = `
            <h4>${deneme.ad}</h4>
            <div class="date">${deneme.tarih.split('-').reverse().join('.')}</div>
            <div class="total-net">${deneme.toplamNet.toFixed(2)} Net</div>
            <div class="history-btn-group">
                <button class="btn-detail btn-edit" onclick="event.stopPropagation(); denemeDuzenle(${deneme.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Düzenle
                </button>
                <button class="btn-detail btn-delete" onclick="event.stopPropagation(); denemeSil(${deneme.id})">
                    <i class="fa-solid fa-trash"></i> Sil
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// MODAL YÖNETİMİ
function modalAc(id) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById(id).style.display = 'block';
}

function modalKapat(id) {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById(id).style.display = 'none';
}

// Tıklanan Yere Göre Modalı Kapatma
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if(e.target === this) {
        document.querySelectorAll('.custom-modal').forEach(m => m.style.display = 'none');
        this.style.display = 'none';
    }
});

// A) DETAY MODALI GÖSTERİMİ
window.denemeDetayGoster = function(id) {
    console.log("Düzenle butonu tıklandı! ID:", id); // Bunu ekle
    const deneme = tumDenemeler.find(d => d.id === id);
    if(!deneme) return;

    document.getElementById('detay-baslik').textContent = deneme.ad + " Detayı";
    const modalBody = document.getElementById('details-modal-body');
    
    let html = `<table class="detay-tablo">
                    <tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Net</th></tr>`;
    
    const mufredat = sinavMufredati[deneme.sinavTuru];
    mufredat.forEach(ders => {
        const v = deneme.dersler[ders.id] || {d:0, y:0, net:0};
        html += `<tr><td>${ders.ad}</td><td>${v.d}</td><td>${v.y}</td><td style="color:var(--neon-green)">${v.net}</td></tr>`;
    });
    html += `</table>`;

    if(deneme.siralama && (deneme.siralama.sinif || deneme.siralama.okul || deneme.siralama.genel)) {
        html += `<div style="text-align:center; color:var(--text-light); margin-bottom:10px;">
            <strong>Sıralamalar:</strong> Sınıf: ${deneme.siralama.sinif||"-"} | Okul: ${deneme.siralama.okul||"-"} | Genel: ${deneme.siralama.genel||"-"}
        </div>`;
    }

    const tahmin = tahminiPuanHesapla(deneme.sinavTuru, deneme.toplamNet);
    html += `
        <div class="tahmini-puan-box">
            <h4>Tahmini Ham Puan (${deneme.sinavTuru})</h4>
            <div class="puan">${tahmin}</div>
            <small style="color:#9ca3af; font-size:12px;">*Bu hesaplama ÖSYM standart katsayılarına göre yaklaşık bir tahmindir.</small>
        </div>
    `;

    modalBody.innerHTML = html;
    modalAc('details-modal');
}

// B) DÜZENLEME MODALI GÖSTERİMİ VE KAYDI
window.denemeDuzenle = function(id) {
    duzenlenenDenemeId = id;
    const deneme = tumDenemeler.find(d => d.id === id);
    if(!deneme) return;

    const mufredat = sinavMufredati[deneme.sinavTuru];
    const modalBody = document.getElementById('edit-modal-body');

    let html = `<div class="dy-row-header"><div>Ders</div><div>D</div><div>Y</div><div>Net</div></div>`;
    
    mufredat.forEach(ders => {
        const v = deneme.dersler[ders.id] || {d:0, y:0, net:0};
        html += `
            <div class="dy-row">
                <label>${ders.ad}</label>
                <input type="number" class="dy-input edit-calc-d" data-ders="${ders.id}" data-max="${ders.soru}" value="${v.d}" min="0" max="${ders.soru}">
                <input type="number" class="dy-input edit-calc-y" data-ders="${ders.id}" data-max="${ders.soru}" value="${v.y}" min="0" max="${ders.soru}">
                <div class="dy-net-box edit-net-box" id="edit-net-${ders.id}">${v.net}</div>
            </div>
        `;
    });

    html += `<hr style="border-color:var(--border-color); margin: 15px 0;">
            <h4 style="color:white; margin-bottom:10px;">Sıralama Güncelle</h4>
            <div style="display:flex; gap:10px;">
                <input type="number" id="edit-sira-sinif" class="dy-input" placeholder="Sınıf" value="${deneme.siralama?.sinif || ''}">
                <input type="number" id="edit-sira-okul" class="dy-input" placeholder="Okul" value="${deneme.siralama?.okul || ''}">
                <input type="number" id="edit-sira-genel" class="dy-input" placeholder="Genel" value="${deneme.siralama?.genel || ''}">
            </div>`;

    modalBody.innerHTML = html;

    // Düzenleme alanı input validasyonları ve net hesaplamaları
    modalBody.querySelectorAll('.edit-calc-d, .edit-calc-y').forEach(input => {
        input.addEventListener('input', function() {
            girdiKontrol(this);
            const row = this.closest('.dy-row');
            const dVal = parseFloat(row.querySelector('.edit-calc-d').value) || 0;
            const yVal = parseFloat(row.querySelector('.edit-calc-y').value) || 0;
            row.querySelector('.edit-net-box').textContent = (dVal - (yVal / 4)).toFixed(2);
        });
    });

    modalAc('edit-modal');
}

// Düzenlemeyi Kaydet Butonu
document.getElementById('btn-duzenleme-kaydet').addEventListener('click', () => {
    if(!duzenlenenDenemeId) return;
    
    const index = tumDenemeler.findIndex(d => d.id === duzenlenenDenemeId);
    if(index === -1) return;

    let yeniToplamNet = 0;
    const yeniDersler = {};

    document.getElementById('edit-modal-body').querySelectorAll('.dy-row').forEach(row => {
        const dersId = row.querySelector('.edit-calc-d').getAttribute('data-ders');
        const d = parseFloat(row.querySelector('.edit-calc-d').value) || 0;
        const y = parseFloat(row.querySelector('.edit-calc-y').value) || 0;
        const net = parseFloat(row.querySelector('.edit-net-box').textContent) || 0;
        
        yeniDersler[dersId] = { d, y, net };
        yeniToplamNet += net;
    });

    tumDenemeler[index].dersler = yeniDersler;
    tumDenemeler[index].toplamNet = yeniToplamNet;
    tumDenemeler[index].siralama = {
        sinif: document.getElementById('edit-sira-sinif').value || "",
        okul: document.getElementById('edit-sira-okul').value || "",
        genel: document.getElementById('edit-sira-genel').value || ""
    };

    firebaseVerileriKaydet();
    verileriGuncelle();
    modalKapat('edit-modal');
});

// SİLME
window.denemeSil = function(id) {
    if(confirm("Bu denemeyi silmek istediğinize emin misiniz?")) {
        tumDenemeler = tumDenemeler.filter(d => d.id !== id);
        firebaseVerileriKaydet();
        verileriGuncelle();
    }
}

// Başlangıç
arayuzuOlustur('TYT');

// --- 3. YKS HESAPLAMA MOTORU ---

let aktifHesaplamaTuru = "SAY"; // Varsayılan olarak ekran SAY ile başlasın

// Hesaplama Müfredatı ve Katsayıları (ÖSYM standartlarında)
const calcMufredat = {
    "SAY": [
        { id: "ayt-mat", ad: "Matematik", ikon: "MAT", renk: "#3b82f6", soru: 40, katsayi: 3.0 },
        { id: "ayt-fiz", ad: "Fizik", ikon: "FİZ", renk: "#8b5cf6", soru: 14, katsayi: 2.85 },
        { id: "ayt-kim", ad: "Kimya", ikon: "KİM", renk: "#ec4899", soru: 13, katsayi: 3.07 },
        { id: "ayt-biy", ad: "Biyoloji", ikon: "BİY", renk: "#10b981", soru: 13, katsayi: 3.07 }
    ],
    "EA": [
        { id: "ayt-mat", ad: "Matematik", ikon: "MAT", renk: "#3b82f6", soru: 40, katsayi: 3.0 },
        { id: "ayt-edeb", ad: "Edebiyat", ikon: "EDB", renk: "#ef4444", soru: 24, katsayi: 3.0 },
        { id: "ayt-tar1", ad: "Tarih-1", ikon: "TRH", renk: "#f59e0b", soru: 10, katsayi: 2.8 },
        { id: "ayt-cog1", ad: "Coğrafya-1", ikon: "COĞ", renk: "#10b981", soru: 6, katsayi: 3.33 }
    ],
    "SÖZ": [
        { id: "ayt-edeb", ad: "Edebiyat", ikon: "EDB", renk: "#ef4444", soru: 24, katsayi: 3.0 },
        { id: "ayt-tar1", ad: "Tarih-1", ikon: "TRH", renk: "#f59e0b", soru: 10, katsayi: 2.8 },
        { id: "ayt-cog1", ad: "Coğrafya-1", ikon: "COĞ", renk: "#10b981", soru: 6, katsayi: 3.33 },
        { id: "ayt-tar2", ad: "Tarih-2", ikon: "TRH", renk: "#d97706", soru: 11, katsayi: 2.91 },
        { id: "ayt-cog2", ad: "Coğrafya-2", ikon: "COĞ", renk: "#059669", soru: 11, katsayi: 2.91 },
        { id: "ayt-fel", ad: "Felsefe Grubu", ikon: "FEL", renk: "#8b5cf6", soru: 12, katsayi: 3.0 },
        { id: "ayt-din", ad: "Din Kültürü", ikon: "DİN", renk: "#ec4899", soru: 6, katsayi: 3.33 }
    ],
    "DİL": [
        { id: "ydt-dil", ad: "Yabancı Dil", ikon: "DİL", renk: "#3b82f6", soru: 80, katsayi: 3.0 }
    ]
};

// 1. Tab (Buton) Değiştirme Mantığı
const calcTabs = document.querySelectorAll('.calc-tab');
calcTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        calcTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        aktifHesaplamaTuru = this.getAttribute('data-type');
        alanArayuzuOlustur(aktifHesaplamaTuru);
        
        // Tab değiştiğinde sonuç tablosunu gizle
        document.getElementById('result-detail-card').style.display = 'none';
    });
});

// 2. Dinamik Alan Arayüzünü Çizme (Net Takibindeki sisteme benzer)
function alanArayuzuOlustur(tur) {
    const container = document.getElementById('calc-alan-container');
    
    // Eğer sadece TYT seçildiyse sağ tarafı kapat
    if (tur === 'TYT') {
        container.style.display = 'none';
        toplamNetleriHesapla();
        return;
    }
    
    container.style.display = 'block';
    
    let html = `
        <div class="section-title">
            <h3>${tur === 'DİL' ? 'YDT' : 'AYT'} (${tur})</h3>
            <span class="total-net" id="alan-toplam-net">0.00 Toplam Net</span>
        </div>
    `;

    calcMufredat[tur].forEach(ders => {
        html += `
        <div class="ders-row">
            <div class="ders-info">
                <div class="ders-icon" style="background-color: ${ders.renk};">${ders.ikon}</div>
                <div>
                    <h4>${ders.ad}</h4>
                    <span>/${ders.soru}</span>
                </div>
            </div>
            <div class="ders-inputs-calc">
                <input type="number" class="calc-input d-input calc-trigger" data-max="${ders.soru}" id="${ders.id}-d" placeholder="D" min="0">
                <input type="number" class="calc-input y-input calc-trigger" data-max="${ders.soru}" id="${ders.id}-y" placeholder="Y" min="0">
                <div class="net-box" id="${ders.id}-net">0.00</div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    hesaplamaEventleriniBagla(); // Yeni eklenen inputlara validasyon ve dinleyici bağla
}

// 3. İleri Seviye Validasyon Sistemi ve Net Dinleyici
function hesaplamaEventleriniBagla() {
    const calcInputs = document.querySelectorAll('.calc-trigger');
    
    calcInputs.forEach(input => {
        input.addEventListener('input', function() {
            const row = this.closest('.ders-inputs-calc');
            const dInput = row.querySelector('.d-input');
            const yInput = row.querySelector('.y-input');
            const netBox = row.querySelector('.net-box');
            const maxQ = parseInt(this.getAttribute('data-max'));

            // Girdi Kontrolü (Validasyon)
            let d = parseInt(dInput.value) || 0;
            let y = parseInt(yInput.value) || 0;

            if (d < 0) { dInput.value = ''; d = 0; }
            if (y < 0) { yInput.value = ''; y = 0; }
            if (d > maxQ) { dInput.value = maxQ; d = maxQ; }
            if (y > maxQ) { yInput.value = maxQ; y = maxQ; }

            // Eğer Doğru+Yanlış sayısı soruyu geçerse, diğerini otomatik kıs
            if (d + y > maxQ) {
                if (this.classList.contains('d-input')) {
                    yInput.value = maxQ - d;
                    y = maxQ - d;
                } else {
                    dInput.value = maxQ - y;
                    d = maxQ - y;
                }
            }

            // Anlık Net Hesaplama (4 yanlış 1 doğruyu götürür)
            let net = d - (y / 4);
            netBox.textContent = net.toFixed(2);
            netBox.style.color = 'white';

            toplamNetleriHesapla();
        });
    });
}

function toplamNetleriHesapla() {
    // Sabit TYT Netleri
    const tytTr = parseFloat(document.getElementById('tyt-tr-net')?.textContent) || 0;
    const tytSos = parseFloat(document.getElementById('tyt-sos-net')?.textContent) || 0;
    const tytMat = parseFloat(document.getElementById('tyt-mat-net')?.textContent) || 0;
    const tytFen = parseFloat(document.getElementById('tyt-fen-net')?.textContent) || 0;
    const tytToplam = tytTr + tytSos + tytMat + tytFen;
    document.getElementById('tyt-toplam-net').textContent = `${tytToplam.toFixed(2)} Toplam Net`;

    // Aktif Sekmeye Göre Alan Netleri
    if (aktifHesaplamaTuru !== 'TYT') {
        let alanToplam = 0;
        calcMufredat[aktifHesaplamaTuru].forEach(ders => {
            const netBox = document.getElementById(`${ders.id}-net`);
            if (netBox) alanToplam += parseFloat(netBox.textContent) || 0;
        });
        const alanToplamText = document.getElementById('alan-toplam-net');
        if (alanToplamText) {
            alanToplamText.textContent = `${alanToplam.toFixed(2)} Toplam Net`;
        }
    }
}

// 4. Puan Hesapla Butonu ve Gelişmiş Puan Motoru
document.getElementById('btn-hesapla').addEventListener('click', () => {
    let obp = parseFloat(document.getElementById('obp-input').value) || 0;
    if(obp > 100) obp = 100;
    const obpKatkisi = obp * 0.6; 

    // TYT Verilerini Çek
    const tytTr = parseFloat(document.getElementById('tyt-tr-net')?.textContent) || 0;
    const tytSos = parseFloat(document.getElementById('tyt-sos-net')?.textContent) || 0;
    const tytMat = parseFloat(document.getElementById('tyt-mat-net')?.textContent) || 0;
    const tytFen = parseFloat(document.getElementById('tyt-fen-net')?.textContent) || 0;

    let tytKatkisi = 0;
    let alanKatkisi = 0;
    let hamPuan = 0;

    if (aktifHesaplamaTuru === 'TYT') {
        // KULLANICI SADECE TYT HESAPLAMAK İSTERSE: 
        // Katsayılar TYT'nin 500 ham puana ulaşacağı oranda hesaplanır (Base 100).
        tytKatkisi = 100 + (tytTr * 3.3) + (tytSos * 3.4) + (tytMat * 3.3) + (tytFen * 3.4);
        hamPuan = tytKatkisi;
        document.getElementById('detay-ayt').textContent = "0.00 (TYT Özel)";
    } else {
        // YKS (YERLEŞTİRME) HESAPLAMA: %40 TYT Etkisi + %60 AYT/YDT Etkisi
        tytKatkisi = 100 + (tytTr * 1.32) + (tytSos * 1.36) + (tytMat * 1.32) + (tytFen * 1.36);
        
        calcMufredat[aktifHesaplamaTuru].forEach(ders => {
            const net = parseFloat(document.getElementById(`${ders.id}-net`)?.textContent) || 0;
            alanKatkisi += net * ders.katsayi;
        });

        hamPuan = tytKatkisi + alanKatkisi;
        document.getElementById('detay-ayt').textContent = alanKatkisi.toFixed(2).replace('.', ',');
    }

    if (hamPuan > 500) hamPuan = 500;
    const yerlestirmePuani = hamPuan + obpKatkisi;

    // Arayüze Değerleri Yazdır
    document.getElementById('detay-tyt').textContent = tytKatkisi.toFixed(2).replace('.', ',');
    document.getElementById('detay-obp').textContent = `+${obpKatkisi.toFixed(2).replace('.', ',')}`;
    document.getElementById('detay-ham').textContent = hamPuan.toFixed(2).replace('.', ',');
    document.getElementById('sonuc-yerlestirme').textContent = yerlestirmePuani.toFixed(2).replace('.', ',');

    // Tabloyu Göster
    const detailCard = document.getElementById('result-detail-card');
    detailCard.style.display = 'block';
});

// Sayfa İlk Yüklendiğinde Arayüzü Çiz ve Dinleyicileri Kur
alanArayuzuOlustur(aktifHesaplamaTuru);
hesaplamaEventleriniBagla(); // Sabit kalan TYT inputları için dinleyicileri bağlar

// --- 4. TERCİH ROBOTU VE GELİŞMİŞ FİLTRELEME ---
// Global veri havuzumuz (JSON'dan yüklenecek)
let mockDatabase = [];
let currentFilteredData = []; // Filtrelenmiş veriyi hafızada tutar
let currentPage = 1;
const itemsPerPage = 50; // Her sayfada 50 veri

let tercihListem = [];
let gosterSadeceListem = false; 
document.getElementById('tercih-count').textContent = tercihListem.length;

// Verileri JSON dosyasından asenkron olarak çeken ana fonksiyon
async function initApp() {
    try {
        const response = await fetch('universiteler.json');
        if (!response.ok) {
            throw new Error('Veri yüklenirken hata oluştu: ' + response.statusText);
        }
        mockDatabase = await response.json();
        
        // Veri başarıyla geldikten sonra arayüzü ve dropdown filtrelerini doldur
        populateDropdown('uni', 'filter-uni-list');
        populateDropdown('prog', 'filter-prog-list');
        populateDropdown('sehir', 'filter-sehir-list');
        
        // Başlangıçta tüm veriyi filtrelenmiş kabul et ve ilk sayfayı göster
        currentFilteredData = mockDatabase;
        gosterSayfa();
        
    } catch (error) {
        console.error("JSON yükleme hatası:", error);
    }
}

// Dropdown Aç/Kapa Mantığı
document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.dropdown-btn');
    const content = dropdown.querySelector('.dropdown-content');
    const defaultText = btn.childNodes[0].nodeValue.trim(); 

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.custom-dropdown').forEach(d => { 
            if(d !== dropdown) d.classList.remove('active'); 
        });
        dropdown.classList.toggle('active');
    });

    content.addEventListener('click', function(e) {
        e.stopPropagation(); 
    });

    content.addEventListener('change', function(e) {
        if(e.target.type === 'checkbox') {
            const checkedBoxes = Array.from(content.querySelectorAll('input[type="checkbox"]:checked'));
            const count = checkedBoxes.length;
            const icon = '<i class="fa-solid fa-chevron-down"></i>';
            
            if (count === 0) {
                btn.innerHTML = `${defaultText} ${icon}`;
            } else if (count === 1) {
                btn.innerHTML = `${checkedBoxes[0].value} ${icon}`;
            } else {
                btn.innerHTML = `${count} Seçenek İşaretlendi ${icon}`;
            }
        }
    });
});

window.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
});

function populateDropdown(dataKey, containerId) {
    // Verileri benzersiz hale getir ve harf sırasına diz
    const uniqueValues = [...new Set(mockDatabase.map(item => item[dataKey]))].filter(Boolean).sort();
    const container = document.getElementById(containerId);
    
    // Arama kutusu ve checkbox listesi için HTML yapısı
    let html = `
        <div style="padding: 5px; position: sticky; top: 0; background: var(--card-bg, #1e293b); z-index: 10;">
            <input type="text" class="dd-search-input dy-input" placeholder="Ara..." style="width: 100%; padding: 8px; font-size: 14px; margin-bottom: 5px;">
        </div>
        <div class="dd-checkbox-list">
    `;
    
    uniqueValues.forEach(val => {
        html += `<label class="dd-label-item"><input type="checkbox" value="${val}"> <span class="dd-text">${val}</span></label>`;
    });
    html += `</div>`;
    container.innerHTML = html;

    // Arama Motoru Dinleyicisi
    const searchInput = container.querySelector('.dd-search-input');
    const labels = container.querySelectorAll('.dd-label-item');
    
    searchInput.addEventListener('input', function(e) {
        // Türkçe karakter destekli küçük harfe çevirme
        const term = e.target.value.toLocaleLowerCase('tr-TR');
        labels.forEach(label => {
            const text = label.querySelector('.dd-text').textContent.toLocaleLowerCase('tr-TR');
            if (text.includes(term)) {
                label.style.display = 'block';
            } else {
                label.style.display = 'none';
            }
        });
    });
}

// Seçili Checkboxları Alma Fonksiyonu
function getCheckedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(cb => cb.value);
}

// Tabloyu Çizme Fonksiyonunu bu şekilde güncelle
function renderTable(data) {
    const tbody = document.getElementById('tercih-tbody');
    tbody.innerHTML = '';

    // Sıralama: Başarı Sırasına göre küçükten büyüğe
    data.sort((a, b) => a.sira - b.sira);

    data.forEach(item => {
        const isAdded = tercihListem.includes(item.id);
        const tr = document.createElement('tr');
        
        // YENİ EKLENEN KOD: Satıra class atayıp sadece mobilde tıklanabilir yaptık
        tr.className = "mobil-tiklanabilir-satir";
        tr.onclick = function(e) {
            // Eğer ekran boyutu mobil (768px ve altı) ise modalı aç
            if (window.innerWidth <= 768) {
                openModal(item.id);
            }
        };

        // DİKKAT: onClick içindeki 'event.stopPropagation();' eklentileri çok önemlidir.
        tr.innerHTML = `
            <td><button class="btn-icon btn-tercih-tablo ${isAdded ? 'added' : ''}" onclick="event.stopPropagation(); toggleTercih(${item.id}, this)">
                <span class="btn-yazi">${isAdded ? 'Listemde' : 'Listeme Ekle'}</span>
                <i class="fa-solid ${isAdded ? 'fa-check' : 'fa-plus'}"></i>
            </button></td>
            <td>${item.programKodu}</td>
            <td>${item.uni}</td>
            <td><strong style="color: var(--text-main);">${item.prog}</strong></td>
            <td>${item.sehir}</td>
            <td>${item.uniTuru}</td>
            <td>${item.puanTuru}</td>
            <td style="font-weight: bold; color: white;">${item.sira.toLocaleString('tr-TR')}</td>
            <td class="detay-sutunu"><button class="btn-detail" onclick="event.stopPropagation(); openModal(${item.id})">Detay <i class="fa-solid fa-chevron-right"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtreleme Ana Motoru
function filterData() {
    const kodVal = document.getElementById('search-kod').value.trim();
    const enAz = parseInt(document.getElementById('search-enaz').value) || 0;
    const enCok = parseInt(document.getElementById('search-encok').value) || 9999999;

    const puanTipleri = getCheckedValues('dd-puan');
    const uniler = getCheckedValues('dd-uni');
    const proglar = getCheckedValues('dd-prog');
    const sehirler = getCheckedValues('dd-sehir');
    const dereceler = getCheckedValues('dd-derece');
    const uniTurleri = getCheckedValues('dd-unituru');
    const ucretler = getCheckedValues('dd-ucret');
    const ogretimTurleri = getCheckedValues('dd-ogretimturu');

    const filtered = mockDatabase.filter(item => {
        if (gosterSadeceListem && !tercihListem.includes(item.id)) return false;
        if (kodVal && !item.programKodu.includes(kodVal)) return false;
        if (item.sira > enAz && enAz !== 0) return false; 
        if (item.sira < enCok && enCok !== 9999999) return false;

        if (puanTipleri.length > 0 && !puanTipleri.includes(item.puanTuru)) return false;
        if (uniler.length > 0 && !uniler.includes(item.uni)) return false;
        if (proglar.length > 0 && !proglar.includes(item.prog)) return false;
        if (sehirler.length > 0 && !sehirler.includes(item.sehir)) return false;
        if (dereceler.length > 0 && !dereceler.includes(item.derece)) return false;
        if (uniTurleri.length > 0 && !uniTurleri.includes(item.uniTuru)) return false;
        if (ucretler.length > 0 && !ucretler.includes(item.ucret)) return false;
        if (ogretimTurleri.length > 0 && !ogretimTurleri.includes(item.ogretimTuru)) return false;

        return true;
    });

    // YENİ: Filtrelenen veriyi global değişkene at ve 1. sayfaya dön
    currentFilteredData = filtered;
    currentPage = 1; 
    gosterSayfa();
}

// YENİ: Sadece istenilen sayfanın verisini kesip tabloya yollar
function gosterSayfa() {
    // Verileri ID'ye göre değil, başarı sırasına göre küçükten büyüğe diz
    currentFilteredData.sort((a, b) => a.sira - b.sira);

    const baslangic = (currentPage - 1) * itemsPerPage;
    const bitis = baslangic + itemsPerPage;
    const sayfaVerisi = currentFilteredData.slice(baslangic, bitis); // Veriyi burada bölüyoruz!
    
    renderTable(sayfaVerisi);
    renderPagination();
}

// Tercih Listem Butonu Tetikleyicisi
document.getElementById('btn-tercih-listem').addEventListener('click', function() {
    gosterSadeceListem = !gosterSadeceListem;
    if(gosterSadeceListem) {
        this.style.backgroundColor = 'var(--neon-green)';
        this.style.color = '#000';
    } else {
        this.style.backgroundColor = '#3b82f6';
        this.style.color = 'white';
    }
    filterData();
});

document.getElementById('btn-filtrele').addEventListener('click', filterData);

// Favorilere Ekle
window.toggleTercih = function(id, btn) {
    const index = tercihListem.indexOf(id);
    if (index === -1) {
        tercihListem.push(id);
        btn.classList.add('added');
        btn.innerHTML = '<span class="btn-yazi">Listemde</span> <i class="fa-solid fa-check"></i>';
    } else {
        tercihListem.splice(index, 1);
        btn.classList.remove('added');
        btn.innerHTML = '<span class="btn-yazi">Listeme Ekle</span> <i class="fa-solid fa-plus"></i>';
        if(gosterSadeceListem) filterData();
    }
    firebaseVerileriKaydet(); // YENİ
    document.getElementById('tercih-count').textContent = tercihListem.length;
}

// MODAL DETAY GÖSTERİMİ
const modal = document.getElementById('detay-modal');
document.querySelector('.close-btn').onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

window.openModal = function(id) {
    const d = mockDatabase.find(item => item.id === id);
    if (!d) return;

    document.getElementById('m-uni-isim').innerHTML = `${d.uni} <span class="badge-vakif" style="background:${d.uniTuru==='DEVLET'?'#3b82f6':'#10b981'}">${d.uniTuru}</span>`;
    document.getElementById('m-prog-isim').textContent = d.prog;
    document.getElementById('m-fakulte-isim').textContent = d.fakulte;
    document.getElementById('m-prog-kodu').textContent = d.programKodu;

    document.getElementById('m-kont-yer').textContent = `${d.yerlesen} / ${d.kontenjan}`;
    document.getElementById('m-doluluk').textContent = d.doluluk;
    document.getElementById('m-bos').textContent = `${d.bos} boş kaldı`;
    
    document.getElementById('m-puan').textContent = d.puan;
    document.getElementById('m-sira').textContent = d.sira.toLocaleString('tr-TR');
    document.getElementById('m-sehir').textContent = d.sehir;
    document.getElementById('m-ogretim-turu').textContent = d.ogretimTuru;
    document.getElementById('m-puan-turu').textContent = d.puanTuru;
    document.getElementById('m-dil').textContent = d.dil;
    document.getElementById('m-burs').textContent = d.ucret;
    document.getElementById('m-siraSarti').textContent = d.siraSarti;
    document.getElementById('m-akreditasyon').textContent = d.akreditasyon;

    document.getElementById('m-son-tyt-tr').textContent = d.netler.tyt?.tr || "-";
    document.getElementById('m-son-tyt-sos').textContent = d.netler.tyt?.sos || "-";
    document.getElementById('m-son-tyt-mat').textContent = d.netler.tyt?.mat || "-";
    document.getElementById('m-son-tyt-fen').textContent = d.netler.tyt?.fen || "-";

    const aytContainer = document.getElementById('m-ayt-net-container');
    const aytBaslik = document.getElementById('ayt-baslik');
    aytContainer.innerHTML = '';
    
    if (d.puanTuru === 'SAY') {
        aytBaslik.textContent = "AYT Netleri";
        aytContainer.innerHTML = `
            <div class="net-row"><span>Matematik:</span> <strong>${d.netler.ayt?.mat || "-"}</strong></div>
            <div class="net-row"><span>Fizik:</span> <strong>${d.netler.ayt?.fiz || "-"}</strong></div>
            <div class="net-row"><span>Kimya:</span> <strong>${d.netler.ayt?.kim || "-"}</strong></div>
            <div class="net-row"><span>Biyoloji:</span> <strong>${d.netler.ayt?.biy || "-"}</strong></div>
        `;
    } 
    else if (d.puanTuru === 'EA') {
        aytBaslik.textContent = "AYT Netleri";
        aytContainer.innerHTML = `
            <div class="net-row"><span>Matematik:</span> <strong>${d.netler.ayt?.mat || "-"}</strong></div>
            <div class="net-row"><span>Türk Dili ve Edebiyatı:</span> <strong>${d.netler.ayt?.edeb || "-"}</strong></div>
            <div class="net-row"><span>Tarih-1:</span> <strong>${d.netler.ayt?.tar1 || "-"}</strong></div>
            <div class="net-row"><span>Coğrafya-1:</span> <strong>${d.netler.ayt?.cog1 || "-"}</strong></div>
        `;
    } 
    else if (d.puanTuru === 'SÖZ') {
        aytBaslik.textContent = "AYT Netleri";
        aytContainer.innerHTML = `
            <div class="net-row"><span>Türk Dili ve Edebiyatı:</span> <strong>${d.netler.ayt?.edeb || "-"}</strong></div>
            <div class="net-row"><span>Tarih-1:</span> <strong>${d.netler.ayt?.tar1 || "-"}</strong></div>
            <div class="net-row"><span>Coğrafya-1:</span> <strong>${d.netler.ayt?.cog1 || "-"}</strong></div>
            <div class="net-row"><span>Tarih-2:</span> <strong>${d.netler.ayt?.tar2 || "-"}</strong></div>
            <div class="net-row"><span>Coğrafya-2:</span> <strong>${d.netler.ayt?.cog2 || "-"}</strong></div>
            <div class="net-row"><span>Felsefe Grubu:</span> <strong>${d.netler.ayt?.fel || "-"}</strong></div>
            <div class="net-row"><span>Din Kültürü:</span> <strong>${d.netler.ayt?.din || "-"}</strong></div>
        `;
    } 
    else if (d.puanTuru === 'DİL') {
        aytBaslik.textContent = "YDT Netleri";
        aytContainer.innerHTML = `
            <div class="net-row"><span>Yabancı Dil:</span> <strong>${d.netler.ydt?.dil || "-"}</strong></div>
        `;
    } 
    else if (d.puanTuru === 'TYT') {
        aytBaslik.textContent = "Sadece TYT Puanı";
        aytContainer.innerHTML = `
            <div class="net-row"><span style="color:var(--text-light); font-size:0.9rem;">Ön lisans bölümleri için AYT/YDT sınavı gerekmemektedir.</span></div>
        `;
    }

    modal.style.display = "block";
}

// Uygulamayı Başlat
initApp();

// --- FİLTRELERİ TEMİZLEME FONKSİYONU ---
document.getElementById('btn-filtre-temizle').addEventListener('click', function() {
    // 1. Tüm yazılı input alanlarını temizle
    document.getElementById('search-kod').value = '';
    document.getElementById('search-enaz').value = '';
    document.getElementById('search-encok').value = '';

    // 2. Bütün checkbox işaretlerini kaldır
    document.querySelectorAll('.dropdown-content input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // 3. Dropdown buton başlıklarını varsayılan hallerine geri döndür
    const defaultTitles = {
        'dd-puan': 'Puan Türü',
        'dd-uni': 'Üniversite',
        'dd-prog': 'Program',
        'dd-sehir': 'Şehir',
        'dd-derece': 'Ön Lisans / Lisans',
        'dd-unituru': 'Üniversite Türü',
        'dd-ucret': 'Ücret/Burs',
        'dd-ogretimturu': 'Öğretim Türü'
    };

    Object.keys(defaultTitles).forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            const btn = dropdown.querySelector('.dropdown-btn');
            btn.innerHTML = `${defaultTitles[id]} <i class="fa-solid fa-chevron-down"></i>`;
        }
    });

    // 4. Tabloyu sıfırlanmış filtrelerle yeniden çiz
    filterData();
});

// --- 3. ANA MENÜ / DASHBOARD SİSTEMİ ---

// A) Karşılama ve Motivasyon Sözleri
function karsilamaAyarla() {
    const saat = new Date().getHours();
    const greetingText = document.getElementById('greeting-text');
    
    if (saat >= 5 && saat < 12) greetingText.textContent = "Günaydın! Verimli bir sabah dilerim ☀️";
    else if (saat >= 12 && saat < 18) greetingText.textContent = "Tünaydın! Çalışmalara tam gaz devam 🚀";
    else if (saat >= 18 && saat < 22) greetingText.textContent = "İyi Akşamlar! Günün yorgunluğunu hedeflerinle at 🌙";
    else greetingText.textContent = "İyi Geceler! Dinlenmeyi unutma 😴";

    const sozler = [
        "Hiçbir başarı tesadüf değildir.",
        "Daha iyisi olana kadar çalışmaya devam et.",
        "Zorluklar, yeteneklerini keşfetmen için birer fırsattır.",
        "Yarın ne olacağın, bugün ne yaptığına bağlıdır.",
        "Kendini geliştirmek için harcadığın zaman, en iyi yatırımdır.",
        "Mazeret yok, sadece sonuçlar var."
    ];
    document.getElementById('daily-quote').textContent = `"${sozler[Math.floor(Math.random() * sozler.length)]}"`;

    const sozElementi = document.getElementById('daily-quote'); // HTML'deki ID'niz
    let index = 0;

    function sozDegistir() {
        // 1. Önce fade sınıfını kaldırıp ekleyerek opacity'i 0'a düşürün
        sozElementi.classList.add('quote-fade-out');

        // 2. 500ms (Yarım saniye) sonra yazı değişsin ve tekrar görünür olsun
        setTimeout(() => {
            index = (index + 1) % sozler.length; // Döngüsel olarak sıradaki söze geç
            sozElementi.textContent = `"${sozler[index]}"`; // Başına ve sonuna tırnak ekler

            // CSS animasyonunu tetiklemek için sınıfı değiştirin
            sozElementi.classList.remove('quote-fade-out');
        }, 400); 
    }

    // 5 saniye aralıkla fonksiyonu çalıştır
    setInterval(sozDegistir, 10000);
}

// B) Hızlı İstatistikleri Güncelleme (TYT & AYT Ayrıntılı Versiyon)
function istatistikleriGuncelle() {
    const tytDenemeleri = tumDenemeler.filter(d => d.sinavTuru === "TYT");
    const aytDenemeleri = tumDenemeler.filter(d => d.sinavTuru !== "TYT");

    // 1. Toplam Deneme Sayıları
    document.getElementById('stat-total-tyt').textContent = tytDenemeleri.length;
    document.getElementById('stat-total-ayt').textContent = aytDenemeleri.length;

    // 2. TYT Net Hesaplamaları
    if (tytDenemeleri.length > 0) {
        // Son TYT Neti
        const sonTyt = tytDenemeleri[tytDenemeleri.length - 1];
        document.getElementById('stat-last-tyt').textContent = sonTyt.toplamNet.toFixed(2);
        
        // En Yüksek TYT Neti
        const enYuksekTyt = Math.max(...tytDenemeleri.map(d => d.toplamNet));
        document.getElementById('stat-best-tyt').textContent = enYuksekTyt.toFixed(2);
    } else {
        document.getElementById('stat-last-tyt').textContent = "-";
        document.getElementById('stat-best-tyt').textContent = "-";
    }

    // 3. AYT Net Hesaplamaları
    if (aytDenemeleri.length > 0) {
        // Son AYT Neti ve Sınav Türü
        const sonAyt = aytDenemeleri[aytDenemeleri.length - 1];
        let sonAlanAdi = sonAyt.sinavTuru.replace('AYT_', ''); // AYT_SAY -> SAY yapar
        document.getElementById('stat-last-ayt').textContent = `${sonAyt.toplamNet.toFixed(2)} (${sonAlanAdi})`;
        
        // En Yüksek AYT Neti ve Sınav Türü
        const enYuksekAytDeneme = aytDenemeleri.reduce((max, d) => d.toplamNet > max.toplamNet ? d : max, aytDenemeleri[0]);
        let enYuksekAlanAdi = enYuksekAytDeneme.sinavTuru.replace('AYT_', '');
        document.getElementById('stat-best-ayt').textContent = `${enYuksekAytDeneme.toplamNet.toFixed(2)} (${enYuksekAlanAdi})`;
    } else {
        document.getElementById('stat-last-ayt').textContent = "-";
        document.getElementById('stat-best-ayt').textContent = "-";
    }
}

// C) Günlük Hedefler (To-Do List) Sistemi
let hedefler = [];
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

function hedefleriCiz() {
    todoList.innerHTML = '';
    hedefler.forEach((hedef, index) => {
        const li = document.createElement('li');
        if (hedef.tamamlandi) li.classList.add('completed');
        
        li.innerHTML = `
            <div class="todo-text-wrap" onclick="hedefTamamla(${index})">
                <input type="checkbox" class="todo-checkbox" ${hedef.tamamlandi ? 'checked' : ''} onclick="event.stopPropagation(); hedefTamamla(${index})">
                <span>${hedef.metin}</span>
            </div>
            <button onclick="hedefSil(${index})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        todoList.appendChild(li);
    });
}

document.getElementById('btn-add-todo').addEventListener('click', () => {
    const metin = todoInput.value.trim();
    if (metin !== "") {
        hedefler.push({ metin: metin, tamamlandi: false });
        firebaseVerileriKaydet();
        todoInput.value = '';
        hedefleriCiz();
    }
});

// Enter tuşu ile hedef ekleme
todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('btn-add-todo').click();
});

window.hedefTamamla = function(index) {
    hedefler[index].tamamlandi = !hedefler[index].tamamlandi;
    firebaseVerileriKaydet();
    hedefleriCiz();
}

window.hedefSil = function(index) {
    hedefler.splice(index, 1);
    firebaseVerileriKaydet();
    hedefleriCiz();
}

// Orijinal verileriGuncelle fonksiyonunun içine istatistik güncellemeyi ekliyoruz
const eskiVerileriGuncelle = verileriGuncelle;
verileriGuncelle = function() {
    eskiVerileriGuncelle();
    istatistikleriGuncelle(); // Grafiklerle beraber ana menü de güncellensin
}

// Başlangıç tetiklemeleri
karsilamaAyarla();
istatistikleriGuncelle();
hedefleriCiz();

// D) Ortalama Netleri Hesaplama ve Ekrana Çizme Sistemi
function ortalamalariHesapla() {
    const tytKart = document.getElementById('tyt-ortalama-kart');
    const aytKart = document.getElementById('ayt-ortalama-kart');

    // 1. TYT HESAPLAMALARI
    const tytDenemeleri = tumDenemeler.filter(d => d.sinavTuru === "TYT");
    if (tytDenemeleri.length > 0) {
        let tytToplam = { tr: 0, mat: 0, sos: 0, fen: 0 };
        let genelToplam = 0;

        tytDenemeleri.forEach(d => {
            genelToplam += d.toplamNet;
            if(d.dersler.tr) tytToplam.tr += d.dersler.tr.net;
            if(d.dersler.mat) tytToplam.mat += d.dersler.mat.net;
            if(d.dersler.sos) tytToplam.sos += d.dersler.sos.net;
            if(d.dersler.fen) tytToplam.fen += d.dersler.fen.net;
        });

        const adet = tytDenemeleri.length;
        let html = `<h3 style="color: white; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">📊 TYT Ortalama</h3>`;
        const isimler = { tr: "Türkçe", mat: "Matematik", sos: "Sosyal Bil.", fen: "Fen Bilimleri" };

        for(let dersId in tytToplam) {
            html += `<div class="ortalama-satir"><span class="ortalama-ders">${isimler[dersId]}</span><span class="ortalama-net">${(tytToplam[dersId] / adet).toFixed(2)}</span></div>`;
        }
        html += `<div class="ortalama-toplam"><span class="ortalama-ders">Toplam TYT</span><span class="ortalama-net">${(genelToplam / adet).toFixed(2)}</span></div>`;
        tytKart.innerHTML = html;
    } else {
        tytKart.innerHTML = `<h3 style="color: white;">📊 TYT Ortalama</h3><p style="color: var(--text-light); margin-top: 10px;">Henüz TYT denemesi girilmedi.</p>`;
    }

    // 2. AYT HESAPLAMALARI (Otomatik Alan Tespiti)
    const aytDenemeleri = tumDenemeler.filter(d => d.sinavTuru !== "TYT");
    if (aytDenemeleri.length > 0) {
        // En son girilen AYT'nin türünü baz alır (Böylece Sayısalcıysan sadece Sayısal ortalamanı gösterir)
        const aktifAytTuru = aytDenemeleri[aytDenemeleri.length - 1].sinavTuru;
        const hedefDenemeler = aytDenemeleri.filter(d => d.sinavTuru === aktifAytTuru);
        const adet = hedefDenemeler.length;
        const mufredat = sinavMufredati[aktifAytTuru];

        let aytDersToplamlari = {};
        let genelAytToplam = 0;
        mufredat.forEach(ders => aytDersToplamlari[ders.id] = 0);

        hedefDenemeler.forEach(d => {
            genelAytToplam += d.toplamNet;
            mufredat.forEach(ders => {
                if(d.dersler[ders.id]) aytDersToplamlari[ders.id] += d.dersler[ders.id].net;
            });
        });

        let baslikAdi = aktifAytTuru.replace('_', ' '); // AYT_SAY -> AYT SAY olarak görünür
        let html = `<h3 style="color: white; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">📊 ${baslikAdi} Ortalama</h3>`;

        mufredat.forEach(ders => {
            html += `<div class="ortalama-satir"><span class="ortalama-ders">${ders.ad}</span><span class="ortalama-net">${(aytDersToplamlari[ders.id] / adet).toFixed(2)}</span></div>`;
        });
        html += `<div class="ortalama-toplam"><span class="ortalama-ders">Toplam AYT</span><span class="ortalama-net">${(genelAytToplam / adet).toFixed(2)}</span></div>`;
        aytKart.innerHTML = html;
    } else {
        aytKart.innerHTML = `<h3 style="color: white;">📊 AYT Ortalama</h3><p style="color: var(--text-light); margin-top: 10px;">Henüz AYT denemesi girilmedi.</p>`;
    }
}

// Ana menü güncellenirken ortalamalar da hesaplansın diye mevcut kodu güncelliyoruz
const oncekiIstatistikGuncelle = istatistikleriGuncelle;
istatistikleriGuncelle = function() {
    oncekiIstatistikGuncelle(); // Eski istatistikleri say (toplam net vs.)
    ortalamalariHesapla();      // Yeni ortalamaları hesapla
}

// Sayfa ilk yüklendiğinde ortalamaları bir kere çiz
ortalamalariHesapla();

// --- 4. GELİŞMİŞ YAPAY ZEKA PROGRAM MOTORU ---

const mebMufredati = {
    "9": {
        "Matematik": [
            "Mantık (Önermeler ve Bileşik Önermeler)",
            "Kümeler (Küme Kavramı, Alt Küme, Kümelerde İşlemler)",
            "Denklemler ve Eşitsizlikler (Sayı Kümeleri, Bölünebilme Kuralları, EBOB-EKOK)",
            "Birinci Dereceden Denklem ve Eşitsizlikler (Mutlak Değer)",
            "Üslü ve Köklü İfadeler (Oran-Orantı, Denklem ve Eşitsizlik Uygulamaları/Problemler)",
            "Üçgenler (Açı-Kenar Bağıntıları, Eşlik, Benzerlik, Metrik Bağıntılar, Trigonometriye Giriş, Alan)",
            "Veri (Merkezi Eğilim ve Yayılım Ölçüleri, Grafik Yorumlama)"
        ],
        "Fizik": [
            "Fizik Bilimine Giriş",
            "Madde ve Özellikleri (Kütle, Hacim, Özkütle, Dayanıklılık, Yapışma ve Tutma)",
            "Hareket ve Kuvvet (Konum, Sürat, Hız, İvme, Newton'ın Hareket Yasaları, Sürtünme)",
            "Enerji (İş, Güç, Kinetik ve Potansiyel Enerji, Enerji Korunumu ve Verim)",
            "Isı ve Sıcaklık (Genleşme, İç Enerji, Isı Alışverişi, Hal Değişimi)",
            "Elektrostatik (Elektrik Yükleri, Dokunma ve Etkiyle Elektriklenme, Coulomb Kanunu)"
        ],
        "Kimya": [
            "Kimya Bilimi (Kimyanın Alanları, Sembolik Dil, Güvenlik Kuralları)",
            "Atom ve Periyodik Sistem (Atom Modelleri, Yapısı, Periyodik Sistem ve Özellikleri)",
            "Kimyasal Türler Arası Etkileşimler (Güçlü ve Zayıf Etkileşimler, Fiziksel ve Kimyasal Değişimler)",
            "Maddenin Halleri (Katılar, Sıvılar, Gazlar, Plazma)",
            "Doğa ve Kimya (Su ve Hayat, Çevre Kimyası)"
        ],
        "Biyoloji": [
            "Yaşam Bilimi Biyoloji (Canlıların Ortak Özellikleri)",
            "Canlıların Yapısında Bulunan Temel Bileşikler (İnorganik ve Organik Maddeler)",
            "Hücre (Hücre Teorisi, Yapısı, Organeller, Hücre Zarından Madde Geçişleri)",
            "Canlılar Dünyası (Canlıların Sınıflandırılması, Canlı Alemleri ve Virüsler)"
        ],
        "Türk Dili ve Edebiyatı": [
            "Edebiyata Giriş (Edebiyatın Bilimlerle İlişkisi, Metinlerin Sınıflandırılması, Dil Bilgisi)",
            "Hikaye (Olay ve Durum Hikayesi, Yazım ve Noktalama)",
            "Şiir (Şiir Bilgisi, Kafiye, Ölçü, Söz Sanatları)",
            "Masal ve Fabl (Tür Özellikleri, Edat, Bağlaç, Ünlem)",
            "Roman (Tür Özellikleri, Roman Yapısı, Zamirler)",
            "Tiyatro (Temel Kavramlar, Geleneksel ve Modern Tiyatro, Sıfatlar)",
            "Biyografi ve Otobiyografi (Tezkire, Öz Geçmiş, Fiiller)",
            "Mektup ve E-Posta (Yazışma Kuralları, Zarflar)",
            "Günlük ve Blog (Günce, Fiilde Çatı)"
        ]
    },
    "10": {
        "Matematik": [
            "Sayma ve Olasılık (Toplama ve Çarpma İlkeleri, Permütasyon, Kombinasyon, Binom Açılımı)",
            "Basit Olayların Olasılığı",
            "Fonksiyonlar (Fonksiyon Kavramı, Grafikler, Bileşke ve Ters Fonksiyonlar)",
            "Polinomlar (Polinom Kavramı, Polinomlarda İşlemler, Çarpanlara Ayırma)",
            "İkinci Dereceden Denklemler (Karmaşık Sayılar, Kök-Katsayı İlişkileri)",
            "Çokgenler ve Dörtgenler (Özel Dörtgenler; Yamuk, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Deltoid)",
            "Uzay Geometri (Prizma, Piramit, Katı Cisimlerin Alan ve Hacimleri)"
        ],
        "Fizik": [
            "Elektrik ve Manyetizma (Akım, Direnç, Potansiyel Farkı, Ohm Kanunu, Seri/Paralel Bağlama, Elektriksel Güç)",
            "Manyetizma (Mıknatıslar, Akımın Manyetik Etkisi, Yer'in Manyetik Alanı)",
            "Basınç ve Kaldırma Kuvveti (Katı, Sıvı ve Gaz Basıncı, Arşimet İlkesi)",
            "Dalgalar (Dalgaların Temel Değişkenleri, Yay, Su, Ses ve Deprem Dalgaları)",
            "Optik (Aydınlanma, Gölge, Yansıma, Düzlem ve Küresel Aynalar, Kırılma, Mercekler, Prizmalar, Renk)"
        ],
        "Kimya": [
            "Kimyanın Temel Kanunları ve Kimyasal Hesaplamalar (Kütlenin Korunumu, Sabit Oranlar, Katlı Oranlar)",
            "Mol Kavramı ve Kimyasal Tepkimeler (Tepkime Türleri, Hesaplamalar, Sınırlayıcı Bileşen)",
            "Karışımlar (Homojen ve Heterojen Karışımlar, Derişim, Koligatif Özellikler, Ayırma Teknikleri)",
            "Asitler, Bazlar ve Tuzlar (Asit-Baz Özellikleri, pH, Nötralleşme, Tuzların Özellikleri)",
            "Kimya Her Yerde (Temizlik Maddeleri, Polimerler, Kozmetikler, İlaçlar, Gıdalar)"
        ],
        "Biyoloji": [
            "Hücre Bölünmeleri (Mitoz Bölünme ve Eşeysiz Üreme)",
            "Mayoz Bölünme ve Eşeyli Üreme",
            "Kalıtımın Genel İlkeleri (Mendel İlkeleri, Çaprazlamalar, Eş Baskınlık, Çok Alellik, Soyağaçları)",
            "Eşey Kolaylığı ve Mutasyonlar",
            "Ekosistem Ekolojisi ve Güncel Çevre Sorunları (Madde Döngüleri, Biyoçeşitlilik, Küresel Isınma)"
        ],
        "Türk Dili ve Edebiyatı": [
            "Giriş (Edebiyat Tarihi, Türk Edebiyatının Dönemleri, Yazım ve Noktalama)",
            "Dede Korkut Hikayeleri, Halk Hikayesi, Cenkname, Mesnevi",
            "Geçiş Dönemi Eserleri, Halk Şiiri, Divan Şiiri, Tanzimat Şiiri",
            "Destan ve Efsane (Doğal ve Yapay Destanlar, İsim Tamlamaları)",
            "Roman (Tanzimat, Servetifünun ve Millî Edebiyat Romanı, Fiilimsiler)",
            "Tiyatro (Geleneksel Türk Tiyatrosu, Modern Tiyatro, Cümlenin Ögeleri)",
            "Anı (Hatırat, Yazım Kuralları)",
            "Haber Metni (İnternet Haberciliği, Noktalama İşaretleri)",
            "Gezi Yazısı (Seyahatname, Cümle Türleri)"
        ]
    },
    "11": {
        "Matematik": [
            "Trigonometri (Yönlü Açılar, Trigonometrik Fonksiyonlar, Grafikler, Ters Trigonometrik Fonksiyonlar)",
            "Analitik Geometri (Doğrunun Analitik İncelenmesi, Eğim, Doğru Denklemleri)",
            "Fonksiyonlarda Uygulamalar (İkinci Dereceden Fonksiyonlar/Parabol, Grafik Dönüşümleri)",
            "Denklem ve Eşitsizlik Sistemleri (İkinci Dereceden İki Bilinmeyenli Denklem ve Eşitsizlikler)",
            "Çember ve Daire (Çemberde Açılar, Kiriş Özellikleri, Teğet, Çemberin Çevresi ve Dairenin Alanı)",
            "Uzay Geometri (Silindir, Koni, Küre, Alan ve Hacim Hesaplamaları)",
            "Olasılık (Koşullu Olasılık, Bağımlı ve Bağımsız Olaylar, Bileşik Olaylar)"
        ],
        "Fizik": [
            "Kuvvet ve Hareket (Vektörler, Bağıl Hareket, Newton'ın Hareket Yasaları)",
            "Bir Boyutta Sabit İvmeli Hareket (Dikey ve Yatay Atışlar, Limit Hız)",
            "İki Boyutta Hareket (Yatay ve Eğik Atış Hareketi)",
            "Enerji ve Hareket (Mekanik Enerjinin Korunumu, Sürtünmeli Ortamlarda Enerji)",
            "İtme ve Çizgisel Momentum (Momentum Korunumu, Çarpışmalar, Patlamalar)",
            "Tork ve Denge (Paralel Kuvvetlerin Dengesi, Kütle ve Ağırlık Merkezi)",
            "Basit Makineler (Kaldıraç, Makara, Palanga, Eğik Düzlem, Çıkrık, Vida, Dişli Çark)",
            "Elektriksel Kuvvet ve Alan (Coulomb Yasası, Noktasal Yüklerin Alanı)",
            "Elektriksel Potansiyel (Elektriksel İş, Potansiyel Enerji, Paralel Levhalar)",
            "Sığa ve Kondansatörler",
            "Manyetizma ve Elektromanyetik İndükleme (Akımın Manyetik Alanı, Manyetik Kuvvet, İndüksiyon Akımı, Özindüksiyon)",
            "Alternatif Akım ve Transformatörler"
        ],
        "Kimya": [
            "Modern Atom Teorisi (Kuantum Sayıları, Elektron Dizilimleri, Periyodik Özellikler, Elementleri Tanıyalım)",
            "Gazlar (Gaz Yasaları, İdeal Gaz Denklemi, Gaz Karışımları, Gerçek Gazlar, Kinetik Teori)",
            "Sıvı Çözeltiler ve Çözünürlük (Derişim Birimleri, Koligatif Özellikler, Çözünürlüğe Etki Eden Faktörler)",
            "Kimyasal Tepkimelerde Enerji (Standart Oluşum Entalpileri, Hess Yasası, Bağ Enerjileri)",
            "Kimyasal Tepkimelerde Hız (Çarpışma Teorisi, Tepkime Hızını Etkileyen Faktörler)",
            "Kimyasal Tepkimelerde Denge (Maksimum Düzensizlik ve Minimum Enerji, Dengeyi Etkileyen Faktörler)",
            "Sulu Çözelti Dengeleri (Asit-Baz Dengesi, Tampon Çözeltiler, Hidroliz, Titrasyon, Çözünürlük Dengesi/Kçç)"
        ],
        "Biyoloji": [
            "İnsan Fizyolojisi (Denetleyici ve Düzenleyici Sistem, Sinir Sistemi, Hormonal Sistem/Endokrin Bezler)",
            "Duyu Organları (Göz, Kulak, Deri, Burun, Dil Yapısı ve Rahatsızlıkları)",
            "Destek ve Hareket Sistemi (Kıkırdak ve Kemik Dokular, Kas Sistemi, Kasılma Mekanizması)",
            "Sindirim Sistemi (Sindirim Organları, Kimyasal Sindirim, Emilim)",
            "Dolaşım ve Bağışıklık Sistemleri (Kalp, Damarlar, Kan Dokusu, Lenf Sistemi, Bağışıklık Katmanları)",
            "Solunum Sistemi (Solunum Organları, Gaz Alışverişi ve Taşınması)",
            "Boşaltım Sistemi (Böbrek Yapısı, Nefronlar, İdrar Oluşumu, Homeostazi)",
            "Üreme Sistemi ve Embriyonik Gelişim (Dişi ve Erkek Üreme Sistemi, Menstrüel Döngü, Embriyo Gelişimi)",
            "Komünite ve Popülasyon Ekolojisi (Türler Arası Rekabet, Simbiyotik İlişkiler, Süksesyon, Popülasyon Dinamiği)"
        ],
        "Türk Dili ve Edebiyatı": [
            "Edebiyata Giriş (Yazınsal Akımlar, Dil Bilgisi)",
            "Hikaye (Cumhuriyet Dönemi Hikayeciliği, Cümlenin Ögeleri)",
            "Şiir (Cumhuriyet Dönemi Şiir Eğilimleri, Yazım Kuralları)",
            "Makale (Bilimsel Metinler, Noktalama İşaretleri)",
            "Sohbet ve Fıkra (Söyleşi, Gazete Köşe Yazısı, Noktalama)",
            "Roman (Cumhuriyet Dönemi Romanı, Anlatım Bozuklukları)",
            "Tiyatro (Cumhuriyet Dönemi Tiyatrosu, Yazım Kuralları)",
            "Eleştiri (Kritik, Dil Bilgisi Uygulamaları)",
            "Mülakat ve Röportaj (Söyleşi Teknikleri)"
        ]
    },
    "12": {
        "Matematik": [
            "Üstel ve Logaritmik Fonksiyonlar (Üstel Fonksiyon, Logaritma Fonksiyonu ve Özellikleri, Denklemler)",
            "Diziler (Aritmetik ve Geometrik Diziler, Toplam Sembolü)",
            "Trigonometri (Toplam-Fark Formülleri, Yarım Açı Formülleri, Trigonometrik Denklemler)",
            "Çemberin Analitik İncelenmesi (Çemberin Standart ve Genel Denklemi)",
            "Limit ve Süreklilik (Yaklaşım Kavramı, Limit Kuralları, Belirsizlik Türleri, Süreklilik)",
            "Türev (Türev Kavramı, Anlık Değişim Oranı, Türev Alma Kuralları, Teğet-Normal Denklemleri)",
            "Türevin Uygulamaları (Maksimum-Minimum Problemleri, Artan-Azalan Fonksiyonlar, Ekstremum Noktalar, Grafik Çizimi)",
            "İntegral (Belirsiz İntegral, İntegral Alma Yöntemleri, Değişken Değiştirme)",
            "Belirli İntegral ve Uygulamaları (Riemann Toplamı, Eğri Altında Kalan Alan Hesabı, İki Eğri Arasındaki Alan)"
        ],
        "Fizik": [
            "Düzgün Çembersel Hareket (Merkezcil İvme, Merkezcil Kuvvet, Yatay ve Düşey Çembersel Hareket)",
            "Dönme ve Yuvarlanma Hareketi (Açısal Momentum, Eylemsizlik Momenti, Dönme Kinetik Enerjisi)",
            "Kütle Çekimi ve Kepler Yasaları",
            "Basit Harmonik Hareket (Yay ve Basit Sarkaç, Genlik, Periyot, Uzanım, İvme Formülleri)",
            "Dalga Mekaniği (Işıkta Girişim ve Kırınım, Elektromanyetik Dalgalar, Doppler Olayı)",
            "Atom Fiziğine Giriş ve Radyoaktivite (Atom Teorileri, Büyük Patlama, Kuarklar ve Parçacık Fiziği)",
            "Modern Fizik (Özel Görelilik, Kuantum Fiziğine Giriş, Siyah Cisim Işıması, Fotoelektrik ve Compton)",
            "Modern Fiziğin Teknolojideki Uygulamaları (Görüntüleme Teknolojileri, Yarı İletkenler, Ledler, Süper İletkenler)"
        ],
        "Kimya": [
            "Kimya ve Elektrik (Redoks Tepkimeleri, Aktiflik, Galvanik Piller, Nernst Eşitliği, Derişim Pilleri)",
            "Elektroliz (Faraday Kanunları, Suyun Elektrolizi) ve Korozyon",
            "Karbon Kimyasına Giriş (Anorganik-Organik Farkı, Lewis Formülleri, Hibritleşme ve Molekül Geometrileri)",
            "Organik Bileşikler (Alkanlar, Alkenler, Alkinler - Adlandırma, İzomerlik ve Tepkimeleri)",
            "Fonksiyonel Gruplar (Alkoller, Eterler, Aldehitler, Ketonlar, Karboksilik Asitler, Esterler)",
            "Enerji Kaynakları ve Bilimsel Gelişmeler (Fosil Yakıtlar, Alternatif Enerji Kaynakları, Sürdürülebilirlik)"
        ],
        "Biyoloji": [
            "Genden Proteine (Nükleik Asitlerin Keşfi, DNA ve RNA Yapısı, DNA Replikasyonu)",
            "Genetik Şifre ve Protein Sentezi (Transkripsiyon, Translasyon, Santral Dogma)",
            "Canlılarda Enerji Dönüşümleri (Fotosentez Mekanizması, Işığa Bağımlı ve Bağımsız Evreler, Kemosentez)",
            "Hücresel Solunum (Glikoliz, Krebs Döngüsü, ETS, Oksijenli ve Oksijensiz Solunum, Fermantasyon)",
            "Bitki Biyolojisi (Bitkisel Dokular, Kök, Gövde, Yaprak Yapısı, Bitkide Su ve Organik Madde Taşınması)",
            "Bitkilerde Hareket, Fotoperiyodizm ve Bitkilerde Üreme (Çiçek Yapısı, Tozlaşma, Tohum ve Meyve Oluşumu)",
            "Canlılar ve Çevre (Çevre Şartlarının Genetik Değişimlere Etkisi, Tarım ve Hayvancılıkta Uygulamalar)"
        ],
        "Türk Dili ve Edebiyatı": [
            "Giriş (Kelime Meali, Metin Okuma Çalışmaları)",
            "Cumhuriyet Dönemi Saf Şiir, Toplumcu Gerçekçi Şiir, Garip Akımı ve İkinci Yeni Şiiri",
            "Cumhuriyet Dönemi Roman Çözümlemeleri (Bireyin İç Dünyasını Esas Alan, Toplumcu ve Modernist Romanlar)",
            "Tiyatro (Cumhuriyet Sonrası Türk Tiyatrosu Türleri)",
            "Deneme (Tür Özellikleri, Dünya ve Türk Edebiyatında Önemli Temsilcileri)",
            "Söylev / Hitabet (Tür Özellikleri, Tarihsel Örnekler)",
            "Paragrafta Anlam ve Yapı (Ana Düşünce, Yardımcı Düşünce, Paragraf Bölme/Akışı Bozma)",
            "Sözcük, Cümle ve Paragraf Düzeyinde Dil Bilgisi Tekrarları"
        ]
    }
};

// Ana dersler daha fazla zaman alır, ara dersler serpiştirilir
const dersTipleri = {
    "Ana": ["Matematik", "Türkçe", "Fizik"],
    "Ara": ["Tarih", "Coğrafya", "Biyoloji", "Kimya", "Din", "Felsefe"]
};

let seciliSinif = "12";
let zorlukPuani = 50;
let kullaniciİlerlemesi = {}; 
let haftalikPlanData = {}; // Tıklanınca saatleri göstermek için hafızada tutulur

const haftaninGunleri = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function ilerlemeyiSifirla() {
    kullaniciİlerlemesi = {};
    Object.keys(mebMufredati[seciliSinif]).forEach(ders => {
        kullaniciİlerlemesi[ders] = 0; 
    });
}

// 1. Düşük Net Yapan Dersleri Tespit Etme Sistemi
function getZayifDersler() {
    // Puan hesaplama sayfasındaki net DOM'larını okur (Eğer değer girilmemişse yüksek kabul eder)
    const netler = {
        "Türkçe": parseFloat(document.getElementById('tyt-tr-net')?.textContent) || 40,
        "Matematik": parseFloat(document.getElementById('tyt-mat-net')?.textContent) || 40,
        "Sosyal": parseFloat(document.getElementById('tyt-sos-net')?.textContent) || 20,
        "Fen": parseFloat(document.getElementById('tyt-fen-net')?.textContent) || 20
    };

    let zayiflar = [];
    if (netler["Matematik"] < 15) zayiflar.push("Matematik");
    if (netler["Türkçe"] < 20) zayiflar.push("Türkçe");
    if (netler["Fen"] < 10) { zayiflar.push("Fizik"); zayiflar.push("Kimya"); zayiflar.push("Biyoloji"); }
    if (netler["Sosyal"] < 10) zayiflar.push("Tarih");
    
    return zayiflar;
}

// 2. Akıllı Dağıtım: O gün Ana Ders mi yoksa Ara Ders ağırlıklı mı olacak?
function gunlukDersMimarisiOlustur() {
    const bazSayi = Math.max(1, Math.floor(zorlukPuani / 25) + 1); // Zorluğa göre taban ders sayısı
    const zayifDersler = getZayifDersler();
    const mevcutDersler = Object.keys(mebMufredati[seciliSinif]);

    haftalikPlanData = {};

    haftaninGunleri.forEach(gun => {
        let bugununDersleri = [];
        
        // Varyasyon: Bazı günler az, bazı günler çok ders (0 ile 2 arası dalgalanma)
        const varyasyon = Math.floor(Math.random() * 3) - 1; 
        let gunlukHedef = Math.max(1, bazSayi + varyasyon);

        // Algoritma: 1 Ana, 2 Ara ders mantığı vb.
        let anaDersSayisi = Math.random() > 0.5 ? 1 : 2; 
        let araDersSayisi = gunlukHedef - anaDersSayisi;
        if (araDersSayisi < 0) araDersSayisi = 0;

        for(let i=0; i < gunlukHedef; i++) {
            // Zayıf derslere %60 şansla öncelik ver
            let secilenDers = "";
            if (zayifDersler.length > 0 && Math.random() > 0.4) {
                const olasiZayiflar = zayifDersler.filter(d => mevcutDersler.includes(d));
                if (olasiZayiflar.length > 0) {
                    secilenDers = olasiZayiflar[Math.floor(Math.random() * olasiZayiflar.length)];
                }
            }
            
            // Eğer zayıf ders seçilemediyse rastgele seç
            if (!secilenDers) {
                secilenDers = mevcutDersler[Math.floor(Math.random() * mevcutDersler.length)];
            }

            const konuIndex = kullaniciİlerlemesi[secilenDers] % mebMufredati[seciliSinif][secilenDers].length;
            const konu = mebMufredati[seciliSinif][secilenDers][konuIndex];

            bugununDersleri.push({
                ad: secilenDers,
                konu: konu
            });
        }
        haftalikPlanData[gun] = bugununDersleri;
    });
}

// 3. Programı Çizme ve Tıklama Eventleri (DÜZELTİLDİ)
function programiCiz() {
    gunlukDersMimarisiOlustur();
    const grid = document.getElementById('haftalik-program-grid');
    grid.innerHTML = ''; 

    haftaninGunleri.forEach(gun => {
        const gunKarti = document.createElement('div');
        gunKarti.className = 'gun-karti';
        
        // Gün başlığına tıklandığında veya boşluğa tıklandığında modalı aç
        gunKarti.addEventListener('click', () => saatModalAc(gun, haftalikPlanData[gun]));

        const baslik = document.createElement('div');
        baslik.className = 'gun-baslik';
        baslik.innerHTML = `${gun} <span style="font-size: 0.7rem; color: #94a3b8; display: block; margin-top: 2px;">(Saatleri Gör)</span>`;
        gunKarti.appendChild(baslik);

        // Ders görevlerini HTML metni olarak değil, tek tek element olarak ekliyoruz
        haftalikPlanData[gun].forEach((ders, index) => {
            const dersGorevi = document.createElement('div');
            dersGorevi.className = 'ders-gorevi';
            // pointer-events: none; KISMINI KALDIRDIK
            dersGorevi.innerHTML = `<span class="ders-adi">${ders.ad}</span><span class="konu-metni">${ders.konu}</span>`;
            
            // Sadece Derse tıklandığında çalışacak kod
            dersGorevi.addEventListener('click', function(e) {
                // e.stopPropagation() -> Tıklamanın arkadaki gün kartına (modal açıcıya) geçmesini engeller!
                e.stopPropagation(); 
                
                // İlerlemeyi 1 artır
                kullaniciİlerlemesi[ders.ad]++;
                
                // Yeni konuyu bul
                const yeniKonuIndex = kullaniciİlerlemesi[ders.ad] % mebMufredati[seciliSinif][ders.ad].length;
                const yeniKonu = mebMufredati[seciliSinif][ders.ad][yeniKonuIndex];
                
                // Modal açıldığında da yeni konunun görünmesi için ana veriyi güncelle
                haftalikPlanData[gun][index].konu = yeniKonu;

                // Arayüzü yumuşak bir şekilde sadece bu kutu için güncelle
                this.style.transform = "scale(0.95)";
                setTimeout(() => {
                    this.querySelector('.konu-metni').textContent = yeniKonu;
                    this.style.transform = "scale(1)";
                    this.style.borderLeftColor = "#f59e0b"; // Atlandığını belli eden turuncu renk
                }, 150);
            });

            gunKarti.appendChild(dersGorevi);
        });

        grid.appendChild(gunKarti);
    });
}

// 4. Modal (Saat 06:00 - 22:00 Dağıtımı) Sistemi
function saatModalAc(gunAdi, dersler) {
    document.getElementById('modal-gun-baslik').textContent = `${gunAdi} Saatlik Plan`;
    const listesiDiv = document.getElementById('modal-saatler-listesi');
    listesiDiv.innerHTML = '';

    const calismaSaatleri = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    
    // Dersleri rastgele veya ardışık aralıklara yerleştir
    let dersYerlesimi = {};
    let kullanilabilirSaatler = [...calismaSaatleri];

    dersler.forEach(ders => {
        if(kullanilabilirSaatler.length === 0) return; // Saat kalmadıysa ekleme
        
        // Rastgele boş bir saat seç
        const randomIndex = Math.floor(Math.random() * kullanilabilirSaatler.length);
        const secilenSaat = kullanilabilirSaatler[randomIndex];
        dersYerlesimi[secilenSaat] = ders;
        
        // O saati kullanılmış yap
        kullanilabilirSaatler.splice(randomIndex, 1);
    });

    calismaSaatleri.forEach(saat => {
        const saatStr = `${saat.toString().padStart(2, '0')}:00`;
        const bitisStr = `${(saat+1).toString().padStart(2, '0')}:00`;
        const ders = dersYerlesimi[saat];

        let html = '';
        if (ders) {
            html = `
            <div class="saat-dilimi dolu">
                <div class="saat-etiketi">${saatStr} - ${bitisStr}</div>
                <div style="flex: 1;">
                    <strong style="color: white; display:block;">${ders.ad} (1 Saat)</strong>
                    <span style="font-size: 0.85rem; color: #cbd5e1;">${ders.konu}</span>
                </div>
            </div>`;
        } else {
            html = `
            <div class="saat-dilimi">
                <div class="saat-etiketi">${saatStr} - ${bitisStr}</div>
                <div style="color: #64748b; font-size: 0.9rem;">Serbest Zaman / Dinlenme</div>
            </div>`;
        }
        listesiDiv.innerHTML += html;
    });

    // Modalı Göster
    const modal = document.getElementById('saat-modal');
    modal.style.display = 'flex';
}

// Modal Kapatma Olayları
document.getElementById('modal-kapat').addEventListener('click', () => {
    document.getElementById('saat-modal').style.display = 'none';
});
window.addEventListener('click', (e) => {
    const modal = document.getElementById('saat-modal');
    if (e.target === modal) modal.style.display = 'none';
});

// Kontrol Butonları (Zorluk Değiştikçe Konuyu İlerletip Çizer)
document.getElementById('sinif-secimi').addEventListener('change', function(e) {
    seciliSinif = e.target.value;
    ilerlemeyiSifirla();
    programiCiz();
});

// Zorluk puanını 0 ile 100 arasında kitleyen yardımcı fonksiyon
function zorlukGuncelle(yeniDeger) {
    // Math.min ve Math.max ile değeri 0-100 aralığına sıkıştırıyoruz
    zorlukPuani = Math.max(0, Math.min(100, yeniDeger)); 
    document.getElementById('zorluk-puani').value = zorlukPuani;
}

document.getElementById('btn-kolaylastir').addEventListener('click', function() {
    zorlukGuncelle(zorlukPuani - 10);
    programiCiz();
});

document.getElementById('btn-zorlastir').addEventListener('click', function() {
    zorlukGuncelle(zorlukPuani + 10);
    programiCiz();
});

// Kullanıcı kutuya eliyle 500 veya -50 yazarsa diye anlık kontrol
document.getElementById('zorluk-puani').addEventListener('change', function() {
    let girilen = parseInt(this.value) || 50;
    zorlukGuncelle(girilen);
    programiCiz();
});

document.getElementById('btn-program-olustur').addEventListener('click', function() {
    let girilenDeger = parseInt(document.getElementById('zorluk-puani').value) || 50;
    zorlukGuncelle(girilenDeger); // Butona basılınca da güvenliği sağla
    
    // Her yeni oluşturmada, daha önce konulmuş derslerin konusunu 1 tık ilerlet (Geçilmiş hissi)
    haftaninGunleri.forEach(gun => {
        if(haftalikPlanData[gun]) {
            haftalikPlanData[gun].forEach(ders => {
                kullaniciİlerlemesi[ders.ad]++;
            });
        }
    });
    
    programiCiz();
});

// Sayfa Yüklendiğinde Başlat
ilerlemeyiSifirla();
programiCiz();

(function() {
    const encryptedData = {
        name: "RW1pciBBeXRla2lu",
        school: "WWVuaW1haGFsbGUgRmVuIExpc2VzaQ==",
        birthDate: "MjAxMS0wMy0xOFQwODo1NDoyMg=="
    };

    const decode = (str) => atob(str);

    // Ekrana basma
    document.getElementById('dev-name').innerText = decode(encryptedData.name);
    document.getElementById('dev-school').innerText = decode(encryptedData.school);

    // Yaş hesaplama (Doğum tarihini çözerek kullanıyoruz)
    const birthDate = new Date(decode(encryptedData.birthDate));
    const ageElement = document.getElementById("hakkimda-precise-age");

    function yasHesapla() {
        if (!ageElement) return;
        const farkMs = new Date() - birthDate;
        const msYil = 1000 * 60 * 60 * 24 * 365.2421897;
        ageElement.innerText = (farkMs / msYil).toFixed(9);
    }

    setInterval(yasHesapla, 25);
})();

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if(!container) return;
    container.innerHTML = '';
    
    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
    if(totalPages <= 1 && currentFilteredData.length === 0) return; 

    let html = `<div class="yok-atlas-pagination" style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">`;
    
    // Kayıt Göstergesi Metni
    const baslangicKayit = ((currentPage - 1) * itemsPerPage) + 1;
    const bitisKayit = Math.min(currentPage * itemsPerPage, currentFilteredData.length);
    const toplamKayit = currentFilteredData.length;
    
    html += `<span style="color: #9ca3af; font-size: 14px; margin-right: 10px; font-weight: 500;">
                ${toplamKayit} kayıttan ${baslangicKayit}-${bitisKayit}
             </span>`;

    // Önceki butonu
    if (currentPage > 1) {
        html += `<button onclick="sayfaDegistir(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i> Önceki</button>`;
    }

    // Akıllı sayfa numaralandırma
    let bas = Math.max(1, currentPage - 2);
    let son = Math.min(totalPages, currentPage + 2);

    if (bas > 1) html += `<button onclick="sayfaDegistir(1)">1</button><span class="dots">...</span>`;

    for (let i = bas; i <= son; i++) {
        if (i === currentPage) {
            html += `<button class="active-page">${i}</button>`;
        } else {
            html += `<button onclick="sayfaDegistir(${i})">${i}</button>`;
        }
    }

    if (son < totalPages) html += `<span class="dots">...</span><button onclick="sayfaDegistir(${totalPages})">${totalPages}</button>`;

    // Sonraki butonu
    if (currentPage < totalPages) {
        html += `<button onclick="sayfaDegistir(${currentPage + 1})">Sonraki <i class="fa-solid fa-chevron-right"></i></button>`;
    }

    // Manuel Sayfa Giriş Bölümü (onkeydown ile Enter desteği ve gizleme sınıfı eklendi)
    if (totalPages > 1) {
        html += `
            <div class="manual-page-zone" style="display: flex; align-items: center; gap: 6px; margin-left: 10px; padding-left: 10px; border-left: 1px solid #334155;">
                <input type="number" id="manual-page-num" min="1" max="${totalPages}" value="${currentPage}" 
                       onkeydown="if(event.key === 'Enter') manuelSayfaGit()"
                       style="width: 55px; padding: 7px; text-align: center; border-radius: 6px; border: 1px solid #3b82f6; background: var(--card-bg, #1e293b); color: white; font-weight: bold;">
                <span style="color: #9ca3af; font-size: 14px;">/ ${totalPages}</span>
                <button onclick="manuelSayfaGit()" style="padding: 7px 12px; background-color: #3b82f6; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s;">Git</button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Parametresiz çalışan yeni güvenli yönlendirme motoru
window.manuelSayfaGit = function() {
    const input = document.getElementById('manual-page-num');
    if (!input) return;
    
    let hedefSayfa = parseInt(input.value);
    const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
    
    // Sınır kontrolleri
    if (isNaN(hedefSayfa) || hedefSayfa < 1) {
        hedefSayfa = 1;
    } else if (hedefSayfa > totalPages) {
        hedefSayfa = totalPages;
    }
    
    sayfaDegistir(hedefSayfa);
}

// Butonlara tıklayınca çalışacak global sayfa değiştirme fonksiyonu
window.sayfaDegistir = function(page) {
    currentPage = page;
    gosterSayfa();
}

document.addEventListener('DOMContentLoaded', () => {
    // Arayüz Elemanları
    const authModal = document.getElementById('auth-modal');
    const authBaslik = document.getElementById('auth-baslik');
    const authEmail = document.getElementById('auth-email'); // Yeni E-posta alanı
    const authKullaniciAdi = document.getElementById('auth-kullanici-adi');
    const authSifre = document.getElementById('auth-sifre');
    const authSifremiUnuttum = document.getElementById('auth-sifremi-unuttum');
    const authOnayBtn = document.getElementById('auth-onay-btn');
    const authModDegistir = document.getElementById('auth-mod-degistir');
    const authSoru = document.getElementById('auth-soru');
    const authHata = document.getElementById('auth-hata');
    
    const profilBtn = document.getElementById('profil-btn');
    const profilDropdown = document.getElementById('profil-dropdown');
    const profilBasHarf = document.getElementById('profil-bas-harf');
    const hesapBilgisi = document.getElementById('hesap-bilgisi');
    const cikisBtn = document.getElementById('cikis-btn');

    let isLoginMode = true; 
    authKullaniciAdi.style.display = 'none'; // Başlangıçta giriş modu olduğu için kullanıcı adını gizle

    // --- 1. OTURUM KONTROLÜ ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authModal.style.display = 'none';
            // Kaydettiğimiz kullanıcı adını (displayName) çekiyoruz
            const kullaniciAdi = user.displayName || "Kullanıcı";
            profilBasHarf.textContent = kullaniciAdi.charAt(0).toUpperCase();
            hesapBilgisi.textContent = kullaniciAdi;
        } else {
            authModal.style.display = 'flex';
        }
    });

    // --- 2. GİRİŞ VE KAYIT İŞLEMLERİ ---
    authOnayBtn.addEventListener('click', () => {
        const email = authEmail.value.trim();
        const password = authSifre.value.trim();
        const username = authKullaniciAdi.value.trim();
        
        // Ortak Boşluk Kontrolü
        if (email === '' || password === '') {
            hataGoster("E-posta ve şifre boş bırakılamaz!");
            return;
        }

        // --- ŞİFREMİ UNUTTUM İŞLEMİ ---
        authSifremiUnuttum.addEventListener('click', () => {
            const email = authEmail.value.trim();
            
            if (email === '') {
                hataGoster("Lütfen şifrenizi sıfırlamak için önce e-posta adresinizi girin!");
                return;
            }

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    // Başarılı olursa hata kutusunu yeşil yapıp bilgi verelim
                    authHata.style.color = "#10b981"; // Yeşil renk
                    hataGoster("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.");
                    
                    // 3 saniye sonra rengi tekrar orijinal kırmızıya döndürelim ki sonraki hatalar kırmızı görünsün
                    setTimeout(() => {
                        authHata.style.color = "#ef4444"; 
                    }, 3000);
                })
                .catch((error) => {
                    authHata.style.color = "#ef4444"; // Kırmızı renk
                    // Firebase hatalarını Türkçeleştirme
                    if (error.code === 'auth/user-not-found') {
                        hataGoster("Bu e-posta adresine kayıtlı bir hesap bulunamadı.");
                    } else if (error.code === 'auth/invalid-email') {
                        hataGoster("Lütfen geçerli bir e-posta adresi girin.");
                    } else {
                        hataGoster("E-posta gönderilirken bir hata oluştu: " + error.message);
                    }
                });
        });

        if (isLoginMode) {
            // --- GİRİŞ YAPMA MANTIĞI ---
            signInWithEmailAndPassword(auth, email, password)
                .catch((error) => {
                    hataGoster("E-posta veya şifre hatalı!");
                    console.error(error);
                });
        } else {
            // --- KAYIT OLMA MANTIĞI VE KISITLAMALAR ---
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Artık updateProfile tanımlı olduğu için sorunsuz çalışacak
                    return updateProfile(userCredential.user, {
                        displayName: username
                    });
                })
                .then(() => {
                    window.location.reload(); // Profil güncellendikten sonra sayfayı yeniler
                })
                // Kayıt olma fonksiyonunun hata yakalama (catch) kısmı
                .catch((error) => {
                    const hataKutusu = document.getElementById('auth-hata');
                    hataKutusu.style.display = 'block'; // Gizli olan hata kutusunu görünür yapıyoruz

                    // Firebase'den gelen hata koduna göre kullanıcı dostu mesajlar
                    switch (error.code) {
                        case 'auth/email-already-in-use':
                            hataKutusu.innerText = 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
                            break;
            
                        case 'auth/weak-password':
                            hataKutusu.innerText = 'Şifre çok zayıf! Lütfen en az 6 karakterden oluşan daha güvenli bir şifre belirleyin.';
                            break;
            
                        case 'auth/invalid-email':
                            hataKutusu.innerText = 'Girdiğiniz e-posta adresi geçersiz. Lütfen formatı kontrol edin (örnek@domain.com).';
                            break;
            
                        case 'auth/operation-not-allowed':
                            hataKutusu.innerText = 'E-posta/Şifre ile kayıt olma özelliği şu anda sunucuda aktif değil.';
                            break;
                            
                        case 'auth/network-request-failed':
                            hataKutusu.innerText = 'İnternet bağlantısı kurulamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
                            break;
                            
                        default:
                            // Gözden kaçan beklenmedik bir durum olursa sistem orijinal mesajı basar
                            hataKutusu.innerText = 'Kayıt esnasında beklenmedik bir hata oluştu: ' + error.message;
                    }
                });
        }
    });

    // --- 3. GİRİŞ / KAYIT EKRANI GEÇİŞİ ---
    authModDegistir.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authEmail.value = '';
        authKullaniciAdi.value = '';
        authSifre.value = '';
        authHata.style.display = 'none';
        authHata.style.color = "#ef4444";

        if (isLoginMode) {
            authBaslik.textContent = "Giriş Yap";
            authOnayBtn.textContent = "Giriş Yap";
            authSoru.textContent = "Hesabın yok mu?";
            authModDegistir.textContent = "Kayıt Ol";
            authKullaniciAdi.style.display = 'none'; // Giriş yaparken kullanıcı adı sorulmaz
            authSifremiUnuttum.style.display = 'block';
        } else {
            authBaslik.textContent = "Kayıt Ol";
            authOnayBtn.textContent = "Kayıt Ol";
            authSoru.textContent = "Zaten bir hesabın var mı?";
            authModDegistir.textContent = "Giriş Yap";
            authKullaniciAdi.style.display = 'block'; // Kayıt olurken kullanıcı adını göster
            authSifremiUnuttum.style.display = 'none';
        }
    });

    function hataGoster(mesaj) {
        authHata.textContent = mesaj;
        authHata.style.display = 'block';
    }

    profilBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profilDropdown.classList.toggle('dropdown-acik');
        profilDropdown.classList.toggle('dropdown-gizli');
    });

    document.addEventListener('click', () => {
        if (profilDropdown.classList.contains('dropdown-acik')) {
            profilDropdown.classList.remove('dropdown-acik');
            profilDropdown.classList.add('dropdown-gizli');
        }
    });

    // --- 4. ÇIKIŞ YAPMA ---
    cikisBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // Çıkış başarılı olduğunda input alanlarını temizle
            authEmail.value = '';
            authSifre.value = '';
            authKullaniciAdi.value = '';
            
            // Alternatif olarak, çıkış sonrası arayüzün tamamen sıfırlanması için
            // sayfayı yenilemek isterseniz alttaki satırı aktifleştirebilirsiniz:
            // window.location.reload();
        }).catch((error) => {
            console.error("Çıkış yapılırken bir hata oluştu: ", error);
        });
    });
});

// Profil menüsü açıkken dışarıya tıklanırsa menüyü kapat
document.addEventListener('click', function(event) {
    const profilKapsayici = document.querySelector('.profil-kapsayici');
    const profilDropdown = document.getElementById('profil-dropdown');
    
    // Eğer tıklanan yer profil butonunun veya dropdown'ın dışındaysa ve menü açıksa
    if (profilKapsayici && !profilKapsayici.contains(event.target)) {
        profilDropdown.classList.remove('dropdown-acik');
        profilDropdown.classList.add('dropdown-gizli');
    }
});

// Firebase Veri Kaydetme Fonksiyonu
async function firebaseVerileriKaydet() {
    if (!aktifKullaniciId) return; // Kullanıcı giriş yapmamışsa kaydetme
    
    const userRef = doc(db, "kullanicilar", aktifKullaniciId);
    try {
        await setDoc(userRef, {
            denemeler: tumDenemeler,
            tercihler: tercihListem,
            hedefler: hedefler
        }, { merge: true }); // merge: true mevcut verilerin üzerine yazar, silmez
    } catch (error) {
        console.error("Veriler Firebase'e kaydedilirken hata oluştu: ", error);
    }
}