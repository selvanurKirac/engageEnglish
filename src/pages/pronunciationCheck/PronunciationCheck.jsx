import React, { useEffect, useState, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  doc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUserAuth } from "../../context/UserAuthContext";
import Nav from "../../components/Nav";

const speakWord = (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
};

// Benzerlik hesaplama fonksiyonu
const calculateSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix = Array(len1 + 1)
    .fill()
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
};

// Soundex algoritması
const soundex = (str) => {
  if (!str) return "";

  const a = str.toLowerCase().split("");
  const f = a.shift();
  let r = "";

  const codes = {
    a: "",
    e: "",
    i: "",
    o: "",
    u: "",
    h: "",
    w: "",
    y: "",
    b: 1,
    f: 1,
    p: 1,
    v: 1,
    c: 2,
    g: 2,
    j: 2,
    k: 2,
    q: 2,
    s: 2,
    x: 2,
    z: 2,
    d: 3,
    t: 3,
    l: 4,
    m: 5,
    n: 5,
    r: 6,
  };

  r =
    f +
    a
      .map((v) => codes[v])
      .filter((v, i, a) => (i === 0 ? v !== codes[f] : v !== a[i - 1]))
      .join("");

  return (r + "000").slice(0, 4).toUpperCase();
};

const PronunciationCheck = ({ Toggle }) => {
  const [targetWord, setTargetWord] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState("");
  const [correctWords, setCorrectWords] = useState([]);
  const [incorrectWords, setIncorrectWords] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [allAttemptedWords, setAllAttemptedWords] = useState(new Set());
  const [hasPlayedInitialSound, setHasPlayedInitialSound] = useState(false);

  // ✅ Yeni state'ler
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualWord, setManualWord] = useState("");
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [retestWord, setRetestWord] = useState("");
  const [isRetesting, setIsRetesting] = useState(false);

  const isMounted = useRef(false);
  const { user } = useUserAuth();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // ✅ Firebase Collection References
  const getUserPronunciationRef = () => {
    return collection(db, "users", user.uid, "pronunciationWords");
  };

  // ✅ Doğru telaffuz edilen kelimeyi kaydet
  const saveCorrectWord = async (word) => {
    try {
      const correctWordsRef = getUserPronunciationRef();

      // Önce yanlış listesinde var mı kontrol et
      const incorrectQuery = query(
        correctWordsRef,
        where("word", "==", word),
        where("status", "==", "incorrect")
      );
      const incorrectSnapshot = await getDocs(incorrectQuery);

      if (!incorrectSnapshot.empty) {
        // Yanlış kaydı doğru olarak güncelle
        const docRef = incorrectSnapshot.docs[0].ref;
        const currentData = incorrectSnapshot.docs[0].data();
        await updateDoc(docRef, {
          status: "correct",
          correctedAt: new Date(),
          attempts: (currentData.attempts || 1) + 1,
          lastAttempt: new Date(),
        });
        console.log(`🔄 Yanlış kelime doğru olarak güncellendi: ${word}`);
        return;
      }

      // Doğru listesinde var mı kontrol et
      const correctQuery = query(
        correctWordsRef,
        where("word", "==", word),
        where("status", "==", "correct")
      );
      const correctSnapshot = await getDocs(correctQuery);

      if (correctSnapshot.empty) {
        // Hiç yoksa yeni ekle
        await addDoc(correctWordsRef, {
          word: word,
          status: "correct",
          createdAt: new Date(),
          attempts: 1,
          lastAttempt: new Date(),
        });
        console.log(`✅ Doğru kelime kaydedildi: ${word}`);
      } else {
        // Varsa attempt sayısını artır
        const docRef = correctSnapshot.docs[0].ref;
        const currentData = correctSnapshot.docs[0].data();
        await updateDoc(docRef, {
          attempts: (currentData.attempts || 1) + 1,
          lastAttempt: new Date(),
        });
      }
    } catch (error) {
      console.error("Doğru kelime kaydedilemedi:", error);
    }
  };

  // ✅ Yanlış telaffuz edilen kelimeyi kaydet
  const saveIncorrectWord = async (word) => {
    try {
      const correctWordsRef = getUserPronunciationRef();
      const correctQuery = query(
        correctWordsRef,
        where("word", "==", word),
        where("status", "==", "correct")
      );
      const correctSnapshot = await getDocs(correctQuery);

      if (!correctSnapshot.empty) {
        return;
      }

      const incorrectQuery = query(
        correctWordsRef,
        where("word", "==", word),
        where("status", "==", "incorrect")
      );
      const incorrectSnapshot = await getDocs(incorrectQuery);

      if (incorrectSnapshot.empty) {
        await addDoc(correctWordsRef, {
          word: word,
          status: "incorrect",
          createdAt: new Date(),
          attempts: 1,
          lastAttempt: new Date(),
        });
        console.log(`❌ Yanlış kelime kaydedildi: ${word}`);
      } else {
        const docRef = incorrectSnapshot.docs[0].ref;
        const currentData = incorrectSnapshot.docs[0].data();
        await updateDoc(docRef, {
          attempts: (currentData.attempts || 1) + 1,
          lastAttempt: new Date(),
        });
      }
    } catch (error) {
      console.error("Yanlış kelime kaydedilemedi:", error);
    }
  };

  // ✅ Yanlış kelimeyi doğru olarak güncelle - Artık kullanılmıyor
  const updateIncorrectWordToCorrect = async (word) => {
    // Bu fonksiyon artık saveCorrectWord içinde handle ediliyor
    console.log(
      `updateIncorrectWordToCorrect çağrıldı ama artık gerekmiyor: ${word}`
    );
  };

  // ✅ Kullanıcının tüm kelimelerini Firebase'den yükle
  const loadUserWords = async () => {
    if (!user) return;

    try {
      const wordsRef = getUserPronunciationRef();

      // Doğru kelimeleri al
      const correctQuery = query(
        wordsRef,
        where("status", "==", "correct"),
        orderBy("lastAttempt", "desc")
      );
      const correctSnapshot = await getDocs(correctQuery);
      const correctWordsData = correctSnapshot.docs.map(
        (doc) => doc.data().word
      );

      // Yanlış kelimeleri al
      const incorrectQuery = query(
        wordsRef,
        where("status", "==", "incorrect"),
        orderBy("lastAttempt", "desc")
      );
      const incorrectSnapshot = await getDocs(incorrectQuery);
      const incorrectWordsData = incorrectSnapshot.docs.map(
        (doc) => doc.data().word
      );

      setCorrectWords(correctWordsData);
      setIncorrectWords(incorrectWordsData);
    } catch (error) {
      console.error("Kullanıcı kelimeleri yüklenemedi:", error);
      setCorrectWords([]);
      setIncorrectWords([]);
    }
  };

  // ✅ Kelimeyi silme fonksiyonu
  const deleteWord = async (word, status) => {
    try {
      const wordsRef = getUserPronunciationRef();
      const q = query(
        wordsRef,
        where("word", "==", word),
        where("status", "==", status)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);

        if (status === "correct") {
          setCorrectWords((prev) => prev.filter((w) => w !== word));
        } else {
          setIncorrectWords((prev) => prev.filter((w) => w !== word));
        }

        console.log(`🗑️ Kelime silindi: ${word}`);
      }
    } catch (error) {
      console.error("Kelime silinemedi:", error);
    }
  };

  const fetchRandomWord = async (shouldPlaySound = false) => {
    setIsLoading(true);
    try {
      const res = await fetch("https://random-word-api.vercel.app/api?words=1");
      const data = await res.json();
      const word = data[0];
      setTargetWord(word);

      // ✅ Ses çalma koşulları düzeltildi
      if (shouldPlaySound) {
        if (!hasPlayedInitialSound) {
          // İlk açılışta
          setTimeout(() => {
            speakWord(word);
            setHasPlayedInitialSound(true);
          }, 500);
        } else {
          // Sonraki "Yeni Kelime" butonlarında
          setTimeout(() => speakWord(word), 300);
        }
      }
    } catch (err) {
      console.error("Kelime alınamadı:", err);
    } finally {
      setIsLoading(false);
      resetTranscript();
      setResult("");
      setIsRetesting(false);
    }
  };

  const clean = (text) => {
    if (!text) return "";

    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:(){}\[\]"'\-_`~@#$%^&*+=|\\/<>]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\n/g, " ")
      .trim();
  };

  const handleCheck = async () => {
    const originalSaid = transcript;
    const said = clean(transcript);
    const target = clean(targetWord);

    if (!said) {
      setResult("❌ Lütfen önce konuşun.");
      return;
    }

    setAllAttemptedWords((prev) => new Set([...prev, targetWord]));

    const exactMatch = said === target;
    const similarity = calculateSimilarity(said, target);
    const soundexMatch = soundex(said) === soundex(target);

    const altSaid1 = originalSaid
      .replace(/[^\w\s]/gi, "")
      .toLowerCase()
      .trim();
    const altSaid2 = originalSaid.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const altTarget = targetWord.toLowerCase().trim();

    const altMatch1 = altSaid1 === altTarget;
    const altMatch2 = altSaid2 === altTarget;

    const isCorrect =
      exactMatch || similarity > 0.9 || soundexMatch || altMatch1 || altMatch2;
    const isCloseEnough = similarity > 0.7;

    if (isCorrect || isCloseEnough) {
      setResult(
        isCorrect
          ? "✅ Mükemmel! Doğru telaffuz ettiniz!"
          : "✅ Yeterince yakın! Kabul edildi."
      );

      if (!correctWords.includes(targetWord)) {
        await saveCorrectWord(targetWord);
        setCorrectWords((prev) => [...prev, targetWord]);
      }

      if (incorrectWords.includes(targetWord)) {
        setIncorrectWords((prev) => prev.filter((word) => word !== targetWord));
      }

      // ✅ Eğer retest modundaysa modal'ı kapat
      if (isRetesting) {
        setTimeout(() => {
          setShowRetestModal(false);
          setRetestWord("");
          setIsRetesting(false);
        }, 2000);
      }
    } else {
      setResult(
        `❌ Tekrar deneyin! Söylediğiniz: "${said}" | Hedef: "${target}" | Benzerlik: ${Math.round(
          similarity * 100
        )}%`
      );

      if (
        !incorrectWords.includes(targetWord) &&
        !correctWords.includes(targetWord)
      ) {
        await saveIncorrectWord(targetWord);
        setIncorrectWords((prev) => [...prev, targetWord]);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: false,
      language: "en-US",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    SpeechRecognition.stopListening();
  };

  const handleNewWord = () => {
    fetchRandomWord(true); // ✅ Yeni kelimede ses çalsın
  };

  const handlePlaySound = () => {
    speakWord(targetWord);
  };

  // ✅ İngilizce kelime kontrolü - GELİŞTİRİLMİŞ
  const isValidEnglishWord = async (word) => {
    try {
      // Dictionary API ile kelime kontrolü
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ "${word}" geçerli bir İngilizce kelime`);
        return true;
      } else if (response.status === 404) {
        console.log(`❌ "${word}" sözlükte bulunamadı`);
        return false;
      } else {
        console.log(
          `⚠️ API hatası (${response.status}), kelime geçerli sayılıyor`
        );
        return true; // API hatası durumunda geçerli say
      }
    } catch (error) {
      console.log(
        "⚠️ Kelime kontrolü yapılamadı (internet bağlantısı), kelime geçerli sayılıyor:",
        error
      );
      return true; // İnternet bağlantısı sorunu durumunda geçerli say
    }
  };

  // ✅ Manuel kelime girişi - İYİLEŞTİRİLMİŞ
  const handleManualWordSubmit = async () => {
    const trimmedWord = manualWord.trim().toLowerCase();

    if (!trimmedWord) {
      alert("Lütfen bir kelime girin!");
      return;
    }

    // Çok kısa kelimeler
    if (trimmedWord.length < 2) {
      alert("Kelime en az 2 karakter olmalıdır!");
      return;
    }

    // Temel İngilizce karakter kontrolü (daha esnek)
    const englishPattern = /^[a-z\s\-'\.]+$/i; // Case insensitive, nokta da ekledik
    if (!englishPattern.test(trimmedWord)) {
      alert(
        "Lütfen sadece İngilizce karakterler kullanın (harfler, boşluk, tire, apostrof)!"
      );
      return;
    }

    // Loading state
    setIsLoading(true);

    try {
      // Dictionary API ile kontrol (opsiyonel hale getirildi)
      const isValid = await isValidEnglishWord(trimmedWord);

      if (!isValid) {
        setIsLoading(false);
        const retry = confirm(
          `"${trimmedWord}" sözlükte bulunamadı.\n\n` +
            `Yine de devam etmek istiyor musunuz?\n\n` +
            `• Evet: Kelimeyi test et\n` +
            `• Hayır: Farklı bir kelime dene`
        );

        if (!retry) {
          return;
        }
      }

      // Geçerli kelime ise veya kullanıcı zorla devam etmek isterse
      setTargetWord(trimmedWord);
      setTimeout(() => speakWord(trimmedWord), 300);
      setManualWord("");
      setShowManualInput(false);
      setIsLoading(false);
      resetTranscript();
      setResult("");
      setIsRetesting(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Manuel kelime işleme hatası:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  // ✅ Çift tıklama ile retest
  const handleDoubleClick = (word) => {
    setRetestWord(word);
    setTargetWord(word);
    setShowRetestModal(true);
    setIsRetesting(true);
    resetTranscript();
    setResult("");
    setTimeout(() => speakWord(word), 500);
  };

  // ✅ Retest modal'ını kapat
  const closeRetestModal = () => {
    setShowRetestModal(false);
    setRetestWord("");
    setIsRetesting(false);
    fetchRandomWord(false); // Yeni rastgele kelimeye dön
  };

  // ✅ İlk yükleme - Firebase'den kelimeleri yükle
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchRandomWord(true);
    }
  }, []);

  // ✅ Kullanıcı giriş yaptığında kelimeleri yükle
  useEffect(() => {
    if (user) {
      console.log(
        "👤 Kullanıcı giriş yaptı, Firebase'den kelimeler yükleniyor..."
      );
      loadUserWords();
    } else {
      // Kullanıcı çıkış yaptıysa listeleri temizle
      setCorrectWords([]);
      setIncorrectWords([]);
    }
  }, [user]);

  useEffect(() => {
    setIsRecording(listening);
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          <h4>❌ Desteklenmeyen Tarayıcı</h4>
          <p>
            Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome, Edge
            veya Firefox kullanın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav Toggle={Toggle} />
      <div className="container py-5">
        {/* ✅ Retest Modal */}
        {showRetestModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-redo me-2"></i>
                    Kelime Tekrarı
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeRetestModal}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-4">
                    <h3 className="text-primary fw-bold mb-3">{retestWord}</h3>
                    <button
                      className="btn btn-outline-primary btn-lg mb-3"
                      onClick={() => speakWord(retestWord)}
                    >
                      <i className="fas fa-volume-up me-2"></i>
                      Tekrar Dinle
                    </button>
                  </div>

                  {/* Duyulan Metin */}
                  <div className="card mb-3 bg-light">
                    <div className="card-body">
                      <h6 className="card-title text-muted mb-2">
                        <i className="fas fa-ear me-2"></i>
                        Duyulan:
                      </h6>
                      <p className="card-text fs-6 mb-0">
                        {transcript || (
                          <em className="text-muted">Henüz konuşmadınız...</em>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Sonuç */}
                  {result && (
                    <div
                      className={`alert ${
                        result.includes("✅") ? "alert-success" : "alert-danger"
                      } mb-3`}
                    >
                      <strong>{result}</strong>
                    </div>
                  )}

                  {/* Kontrol Butonları */}
                  <div className="d-grid gap-2">
                    <button
                      className={`btn btn-lg ${
                        isRecording ? "btn-danger" : "btn-success"
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <i className="fas fa-stop me-2"></i>
                          Durdur
                        </>
                      ) : (
                        <>
                          <i className="fas fa-microphone me-2"></i>
                          Kayıt Başlat
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-warning btn-lg"
                      onClick={handleCheck}
                      disabled={!transcript || isRecording}
                    >
                      <i className="fas fa-check me-2"></i>
                      Kontrol Et
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Manuel Kelime Girişi Modal */}
        {showManualInput && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-keyboard me-2"></i>
                    Manuel Kelime Girişi
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowManualInput(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="manualWordInput" className="form-label">
                      Telaffuz etmek istediğiniz <strong>İngilizce</strong>{" "}
                      kelimeyi girin:
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="manualWordInput"
                      value={manualWord}
                      onChange={(e) => setManualWord(e.target.value)}
                      placeholder="Örnek: pronunciation, beautiful, knowledge"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        !isLoading &&
                        handleManualWordSubmit()
                      }
                      disabled={isLoading}
                    />
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      Kelime sözlükten kontrol edilir. Bulunamazsa onay istenir.
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-info btn-lg"
                      onClick={handleManualWordSubmit}
                      disabled={!manualWord.trim() || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></div>
                          Kontrol ediliyor...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play me-2"></i>
                          Telaffuz Testine Başla
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="card shadow-lg border-0">
              <div
                className="card-header bg-gradient text-white text-center py-4"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <h2 className="mb-0">
                  <i className="fas fa-microphone-alt me-2"></i>
                  Telaffuz Testi
                </h2>
                <p className="mb-0 mt-2 opacity-90">
                  İngilizce telaffuzunuzu geliştirin
                </p>
              </div>

              <div className="card-body p-4">
                {isLoading ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary mb-3"
                      role="status"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <h5 className="text-muted">Yeni kelime hazırlanıyor...</h5>
                  </div>
                ) : (
                  <>
                    {/* Hedef Kelime Bölümü */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-info fs-6 me-3">
                            Hedef Kelime
                          </span>
                          <h3 className="mb-0 text-primary fw-bold">
                            {targetWord}
                          </h3>
                        </div>
                      </div>
                      <div className="col-md-6 text-md-end mt-2 mt-md-0">
                        <button
                          className="btn btn-outline-primary btn-lg me-2"
                          onClick={handlePlaySound}
                        >
                          <i className="fas fa-volume-up me-2"></i>
                          Dinle
                        </button>
                        {/* ✅ Manuel kelime girişi butonu */}
                        <button
                          className="btn btn-outline-info btn-lg"
                          onClick={() => setShowManualInput(true)}
                        >
                          <i className="fas fa-keyboard me-2"></i>
                          Manuel Giriş
                        </button>
                      </div>
                    </div>

                    {/* Kontrol Butonları */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                          <button
                            className={`btn btn-lg me-md-2 ${
                              isRecording ? "btn-danger" : "btn-success"
                            }`}
                            onClick={
                              isRecording ? stopRecording : startRecording
                            }
                            disabled={isLoading}
                          >
                            {isRecording ? (
                              <>
                                <i className="fas fa-stop me-2"></i>
                                Durdur
                              </>
                            ) : (
                              <>
                                <i className="fas fa-microphone me-2"></i>
                                Kayıt Başlat
                              </>
                            )}
                          </button>

                          <button
                            className="btn btn-warning btn-lg me-md-2"
                            onClick={handleCheck}
                            disabled={!transcript || isRecording}
                          >
                            <i className="fas fa-check me-2"></i>
                            Kontrol Et
                          </button>

                          <button
                            className="btn btn-secondary btn-lg"
                            onClick={handleNewWord}
                            disabled={isRecording}
                          >
                            <i className="fas fa-sync-alt me-2"></i>
                            Yeni Kelime
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Kayıt Durumu */}
                    {isRecording && (
                      <div className="alert alert-info text-center mb-4">
                        <div className="d-flex justify-content-center align-items-center">
                          <div
                            className="spinner-grow spinner-grow-sm text-danger me-3"
                            role="status"
                          >
                            <span className="visually-hidden">Kayıt...</span>
                          </div>
                          <strong>
                            🎙️ Dinliyorum... Lütfen kelimeyi söyleyin
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Duyulan Metin */}
                    <div className="card mb-4 bg-light">
                      <div className="card-body">
                        <h6 className="card-title text-muted mb-2">
                          <i className="fas fa-ear me-2"></i>
                          Duyulan Metin:
                        </h6>
                        <p className="card-text fs-5 mb-0">
                          {transcript || (
                            <em className="text-muted">
                              Henüz bir şey söylemediniz...
                            </em>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Sonuç */}
                    {result && (
                      <div
                        className={`alert ${
                          result.includes("✅")
                            ? "alert-success"
                            : "alert-danger"
                        } text-center mb-4`}
                      >
                        <h5 className="mb-0">{result}</h5>
                      </div>
                    )}

                    {/* İstatistikler */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0">
                              <i className="fas fa-trophy text-warning me-2"></i>
                              Doğru Telaffuzlar:
                              <span className="badge bg-success ms-2 fs-6">
                                {correctWords.length}
                              </span>
                            </h6>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0">
                              <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                              Zorlandığınız:
                              <span className="badge bg-warning ms-2 fs-6">
                                {incorrectWords.length}
                              </span>
                            </h6>
                          </div>
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => setShowStats(!showStats)}
                          >
                            <i
                              className={`fas fa-chevron-${
                                showStats ? "up" : "down"
                              } me-1`}
                            ></i>
                            {showStats ? "Gizle" : "Detayları Göster"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Kelime Listeleri */}
                    {showStats &&
                      (correctWords.length > 0 ||
                        incorrectWords.length > 0) && (
                        <div className="row">
                          {/* Doğru Kelimeler */}
                          {correctWords.length > 0 && (
                            <div className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-header bg-success text-white">
                                  <h6 className="mb-0">
                                    <i className="fas fa-check-circle me-2"></i>
                                    Başarılı Telaffuzlar ({correctWords.length})
                                  </h6>
                                  <small className="opacity-75">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Çift tıklayarak tekrar test edin
                                  </small>
                                </div>
                                <div className="card-body p-0">
                                  <div
                                    style={{
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {correctWords.map((word, index) => (
                                      <div
                                        key={index}
                                        className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                        style={{ cursor: "pointer" }}
                                        onDoubleClick={() =>
                                          handleDoubleClick(word)
                                        }
                                      >
                                        <span className="fw-medium text-success">
                                          {word}
                                        </span>
                                        <div>
                                          <button
                                            className="btn btn-sm btn-outline-success me-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              speakWord(word);
                                            }}
                                          >
                                            <i className="fas fa-volume-up"></i>
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteWord(word, "correct");
                                            }}
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Yanlış Kelimeler */}
                          {incorrectWords.length > 0 && (
                            <div className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-header bg-warning text-dark">
                                  <h6 className="mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Tekrar Denenecekler ({incorrectWords.length}
                                    )
                                  </h6>
                                  <small className="opacity-75">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Çift tıklayarak tekrar test edin
                                  </small>
                                </div>
                                <div className="card-body p-0">
                                  <div
                                    style={{
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {incorrectWords.map((word, index) => (
                                      <div
                                        key={index}
                                        className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                        style={{ cursor: "pointer" }}
                                        onDoubleClick={() =>
                                          handleDoubleClick(word)
                                        }
                                      >
                                        <span className="fw-medium text-warning">
                                          {word}
                                        </span>
                                        <div>
                                          <button
                                            className="btn btn-sm btn-outline-warning me-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              speakWord(word);
                                            }}
                                          >
                                            <i className="fas fa-volume-up"></i>
                                          </button>
                                          <button
                                            className="btn btn-sm btn-warning me-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTargetWord(word);
                                              setTimeout(
                                                () => speakWord(word),
                                                100
                                              );
                                              resetTranscript();
                                              setResult("");
                                            }}
                                          >
                                            <i className="fas fa-redo"></i>
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteWord(word, "incorrect");
                                            }}
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Yardım İpuçları */}
                    <div className="card mt-4 border-info">
                      <div className="card-header bg-info bg-opacity-10">
                        <h6 className="mb-0 text-info">
                          <i className="fas fa-lightbulb me-2"></i>
                          İpuçları & Özellikler
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <ul className="list-unstyled mb-0">
                              <li className="mb-2">
                                <i className="fas fa-check-circle text-success me-2"></i>
                                Mikrofona yakın ve net bir şekilde konuşun
                              </li>
                              <li className="mb-2">
                                <i className="fas fa-check-circle text-success me-2"></i>
                                Önce kelimeyi dinleyin, ardından telaffuz etmeye
                                çalışın
                              </li>
                              <li className="mb-0">
                                <i className="fas fa-check-circle text-success me-2"></i>
                                Sessiz bir ortamda pratik yapın
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-6">
                            <ul className="list-unstyled mb-0">
                              <li className="mb-2">
                                <i className="fas fa-mouse-pointer text-info me-2"></i>
                                Kelimelere <strong>çift tıklayarak</strong>{" "}
                                tekrar test edin
                              </li>
                              <li className="mb-2">
                                <i className="fas fa-keyboard text-info me-2"></i>
                                <strong>Manuel Giriş</strong> ile istediğiniz
                                kelimeyi test edin
                              </li>
                              <li className="mb-0">
                                <i className="fas fa-save text-info me-2"></i>
                                Tüm telaffuzlarınız otomatik kaydedilir
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PronunciationCheck;
