# 🎓 [Proje Adı] – İngilizce Öğrenme Platformu

Kullanıcıların İngilizce seviyelerini belirleyebildiği, dinleme, kelime ve telaffuz pratiği yapabildiği, günlük çalışma sürelerini takip edebildiği web tabanlı bir öğrenme uygulaması.

## ✨ Özellikler

### 🎯 Seviye Tespit Testi
- A1'den C2'ye kadar tüm seviyeleri kapsayan, rastgele seçilen **52 soruluk** test (A1–B2: 8'er, C1–C2: 10'ar soru)
- Her soru için 30 saniye süre
- Puana göre otomatik seviye belirleme ve seviye açıklaması
- Sonuçlar Firestore'a kaydedilir 

### 🎧 Listening (Dinleme) Alıştırmaları
- A1, A2, B1, B2 ve C1 seviyelerine ayrılmış dinleme içerikleri
- Ses oynatıcı, görsel ve açılır/kapanır **transcript** alanı
- Çoktan seçmeli ve Doğru/Yanlış soruları
- Cevapları kontrol etme, doğru/yanlış gösterimi ve tekrar deneme

### 🎮 Kelime Oyunu (Resimli Tahmin)
- Rastgele kelime, [Pexels](https://www.pexels.com/api/) görseli ve çoktan seçmeli cevaplarla oynanan oyun
- 5 dakikalık toplam süre, soru başına 30 saniye
- Puan, seri (streak) takibi ve oyun sonu ekranı
- En yüksek skor ve toplam oyun sayısı Firestore'da tutulur

### ⌨️ Vocabulary Control (Yazım ve Dinleme Testi)
- Kelime sesli okunur (Speech Synthesis), kullanıcı kelimeyi yazar
- 10 soruluk oyun, soru başına 30 saniye
- Kademeli ipucu sistemi
- Skorlar Firestore'a kaydedilir 

### 🎤 Telaffuz Kontrolü
- Tarayıcının konuşma tanıma özelliğiyle (`react-speech-recognition`) telaffuz denemesi
- Doğru ve yanlış telaffuz edilen kelimelerin kullanıcı bazında saklanması
- Yanlış kelimeleri yeniden test etme ve manuel kelime girişi
- Sözlük API'si ile kelime bilgisi

### 💼 Business English
- Sektörlere göre filtrelenebilen iş İngilizcesi kelime kartları (anlam + örnek cümle)
- Sesli telaffuz dinleme
- YouTube Data API ile her kelime için ilgili videoları listeleme

### 📈 Takip ve İstatistikler
- Günlük çalışma süresi ve hedef takibi
- Günlük / haftalık / yıllık **zaman grafikleri** (Recharts)
- Seri (streak) grafiği
- Günlük görev listesi ve XP/puan bölümü *(şu an örnek veriyle çalışan arayüz)*

### 👤 Hesap Yönetimi
- Firebase Authentication ile giriş/çıkış
- Günlük hedef süre ayarı (5–480 dakika)
- Şifre değiştirme (yeniden doğrulama ile)

## 🛠️ Kullanılan Teknolojiler

| Alan | Teknoloji |
|------|-----------|
| Frontend | React, Vite, React Router |
| UI | React Bootstrap, Bootstrap |
| Veritabanı / Auth | Firebase Firestore, Firebase Authentication |
| Grafikler | Recharts |
| Ses | Web Speech API (SpeechSynthesis), `react-speech-recognition` |
| Harici API'ler | Pexels API, YouTube Data API v3, Random Word API, Free Dictionary API |
