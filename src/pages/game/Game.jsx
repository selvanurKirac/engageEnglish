// Sadece start screen'e dön (modal'dan çağrılır)
const goToStartScreen = () => {
  setScore(0);
  setStreak(0);
  setQuestionCount(0);
  setTimeLeft(300);
  setGameActive(false);
  setGameStarted(false);
  setShowEndModal(false);
  setShowStartScreen(true);
  setResult("");
  setSelectedAnswer("");
  setAllowNext(false);
  setLoading(false);

  // Timer'ları temizle
  if (timerRef.current) clearTimeout(timerRef.current);
  if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
};
import React, { useEffect, useState, useRef } from "react";
import Nav from "../../components/Nav";
import { useUserAuth } from "../../context/UserAuthContext";
import { db } from "../../config/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Image,
  Card,
  Badge,
  ProgressBar,
  Modal,
} from "react-bootstrap";

const Game = ({ Toggle }) => {
  const { user } = useUserAuth();
  const [randomWord, setRandomWord] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState([]);
  const [correct, setCorrect] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowNext, setAllowNext] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Yeni state'ler
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameActive, setGameActive] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);

  // Firebase'den kullanıcı istatistiklerini al
  const loadUserStats = async () => {
    if (!user?.uid) return;

    try {
      // Her kullanıcı için ayrı document: gameStats/{userId}
      const userDocRef = doc(db, "gameStats", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setBestScore(data.bestScore || 0);
        setTotalGamesPlayed(data.totalGames || 0);
        console.log(`📊 Kullanıcı istatistikleri yüklendi: ${user.email}`);
      } else {
        console.log(`📊 ${user.email} için ilk oyun, yeni kayıt oluşturulacak`);
      }
    } catch (error) {
      console.error("Kullanıcı istatistikleri yüklenemedi:", error);
    }
  };

  // Firebase'e oyun sonucunu kaydet
  const saveGameResult = async () => {
    if (!user?.uid) {
      console.warn("Kullanıcı giriş yapmamış, oyun sonucu kaydedilmiyor");
      return;
    }

    try {
      // Kullanıcıya özel document: gameStats/{userId}
      const userDocRef = doc(db, "gameStats", user.uid);
      const docSnap = await getDoc(userDocRef);

      const newBestScore = Math.max(score, bestScore);
      const newTotalGames = totalGamesPlayed + 1;

      const gameData = {
        userId: user.uid, // User ID'yi de kaydet
        userEmail: user.email, // Email'i de kaydet (debug için)
        bestScore: newBestScore,
        totalGames: newTotalGames,
        lastScore: score,
        lastStreak: streak,
        lastPlayed: new Date(),
        questionsAnswered: questionCount,
        createdAt: docSnap.exists() ? docSnap.data().createdAt : new Date(), // İlk kayıt tarihi
      };

      if (docSnap.exists()) {
        await updateDoc(userDocRef, gameData);
        console.log(`💾 ${user.email} için oyun sonucu güncellendi`);
      } else {
        await setDoc(userDocRef, gameData);
        console.log(`💾 ${user.email} için ilk oyun sonucu kaydedildi`);
      }

      setBestScore(newBestScore);
      setTotalGamesPlayed(newTotalGames);
    } catch (error) {
      console.error("Oyun sonucu kaydedilemedi:", error);
      // Kullanıcıya hata mesajı gösterebiliriz
      alert("Oyun sonucu kaydedilemedi. İnternet bağlantınızı kontrol edin.");
    }
  };

  // Süre sayacı
  useEffect(() => {
    if (gameActive && gameStarted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameActive, gameStarted]);

  // Soru başına 30 saniye timer
  useEffect(() => {
    if (gameActive && gameStarted && !loading && !result) {
      questionTimerRef.current = setTimeout(() => {
        if (!result) {
          handleAnswer(""); // Boş cevap = yanlış
        }
      }, 30000);
    }

    return () => {
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
    };
  }, [gameActive, gameStarted, loading, result]);

  const fetchRandomWord = async () => {
    const res = await fetch("https://random-word-api.vercel.app/api?words=1");
    const data = await res.json();
    return data[0];
  };

  const fetchImage = async (word) => {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${word}&per_page=1`,
        {
          headers: { Authorization: import.meta.env.VITE_PEXELS_API_KEY },
        }
      );
      if (!res.ok) {
        console.warn(`⚠️ Pexels API hatası (${res.status}) - ${word}`);
        return null;
      }
      const data = await res.json();
      const imageUrl = data.photos?.[0]?.src?.medium || null;
      if (!imageUrl) {
        console.warn(`🚫 "${word}" için görsel bulunamadı.`);
      } else {
        console.log(`🖼️ "${word}" için görsel bulundu.`);
      }
      return imageUrl;
    } catch (error) {
      console.error("🔴 fetchImage() hata:", error);
      return null;
    }
  };

  const fetchWordData = async (word) => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (!response.ok) throw new Error(`API hatası: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Kelime verisi hatası:", err);
      return null;
    }
  };

  const getAntonyms = (data) => {
    const antonyms = new Set();
    data?.[0]?.meanings?.forEach((meaning) => {
      meaning.antonyms?.forEach((a) => antonyms.add(a));
    });
    return Array.from(antonyms);
  };

  const getRandomWords = async (count) => {
    const res = await fetch(
      `https://random-word-api.vercel.app/api?words=${count}`
    );
    return await res.json();
  };

  const speakWithSpeechSynthesis = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => {
        console.log(`🔊 Metin okuma bitti: "${text}"`);
        setAllowNext(true);
      };
      console.log(`🔊 Metin okunuyor: "${text}"`);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("💬 Tarayıcı metin okuma desteği sunmuyor.");
      setAllowNext(true);
    }
  };

  const loadQuestion = async () => {
    // gameActive kontrolünü kaldırıyoruz çünkü startNewGame'de henüz true olmamış olabilir

    setLoading(true);
    setResult("");
    setAllowNext(false);
    setSelectedAnswer("");
    setQuestionCount((prev) => prev + 1);

    // İlk soru için game timer'ı başlat
    if (!gameStarted) {
      setGameStarted(true);
    }

    console.log("🎮 Yeni soru hazırlanıyor...");

    let word = "";
    let image = null;
    let wordData = null;

    let retryCount = 0;
    const maxRetries = 10;

    while (!image && retryCount < maxRetries) {
      retryCount++;
      word = await fetchRandomWord();
      console.log(`🔄 Yeni kelime denemesi: ${word}`);
      image = await fetchImage(word);
    }

    if (!image) {
      console.error("❌ 10 denemede uygun görsel bulunamadı.");
      setResult("⚠️ Görsel bulunamadı. Lütfen sayfayı yenileyin.");
      setLoading(false);
      return;
    }

    wordData = await fetchWordData(word);
    if (!wordData) {
      console.warn("❌ Kelime API'den veri alınamadı, tekrar deneniyor...");
      return loadQuestion();
    }

    const apiWord = wordData[0]?.word?.trim().toLowerCase();
    const originalWord = word.trim().toLowerCase();

    if (apiWord !== originalWord) {
      console.warn(
        `⚠️ "${originalWord}" yerine "${apiWord}" verisi geldi. Güncelleniyor.`
      );
      word = apiWord;
    }

    let antonyms = getAntonyms(wordData);

    if (antonyms.length === 0) {
      console.warn(
        `⚠️ "${word}" için zıt anlamlı kelime yok. Rastgelelerle tamamlanacak.`
      );
      antonyms = [];
    }

    const allOptions = [...antonyms];
    if (!allOptions.includes(word)) allOptions.push(word);

    if (allOptions.length < 4) {
      const needed = 4 - allOptions.length;
      const randoms = await getRandomWords(needed);
      allOptions.push(...randoms);
    }

    const finalOptions = allOptions.sort(() => Math.random() - 0.5).slice(0, 4);

    console.log(`🎯 Doğru cevap: "${word}"`);
    console.log(`📋 Seçenekler: ${finalOptions.join(", ")}`);

    setRandomWord(word);
    setImageUrl(image);
    setOptions(finalOptions);
    setCorrect(word);
    setLoading(false);
  };

  const handleAnswer = (selected) => {
    if (result || !gameActive) return;

    // Question timer'ı temizle
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }

    setSelectedAnswer(selected);
    console.log(`🖱️ Cevap seçildi: "${selected}"`);

    if (selected === correct) {
      setResult("correct");
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);
      setAllowNext(true);
      console.log("✅ Doğru cevap verildi.");
    } else {
      setResult("incorrect");
      setStreak(0);
      console.log("❌ Yanlış cevap! Doğru cevap sesle okunuyor...");
      speakWithSpeechSynthesis(correct);
    }
  };

  const endGame = async () => {
    setGameActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);

    await saveGameResult();
    setShowEndModal(true);
  };

  const startNewGame = async () => {
    // Önce state'leri sıfırla
    setScore(0);
    setStreak(0);
    setQuestionCount(0);
    setTimeLeft(300); // 5 dakika
    setGameStarted(false);
    setShowEndModal(false);
    setShowStartScreen(false);
    setResult("");
    setSelectedAnswer("");
    setAllowNext(false);
    setLoading(true); // Loading'i manuel başlat

    // Sonra gameActive'i true yap ve soruyu yükle
    setGameActive(true);

    // Kısa bir delay ile soruyu yükle
    setTimeout(() => {
      loadQuestion();
    }, 100);
  };

  const backToStartScreen = async () => {
    // Eğer oyun başlamışsa önce sonuçları göster
    if (gameStarted) {
      setGameActive(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);

      await saveGameResult();
      setShowEndModal(true); // Modal'ı göster
      return; // Burada dur, modal'dan devam eder
    }

    // Oyun başlamamışsa direkt start screen'e git
    setScore(0);
    setStreak(0);
    setQuestionCount(0);
    setTimeLeft(300);
    setGameActive(false);
    setGameStarted(false);
    setShowEndModal(false);
    setShowStartScreen(true);
    setResult("");
    setSelectedAnswer("");
    setAllowNext(false);
    setLoading(false);

    // Timer'ları temizle
    if (timerRef.current) clearTimeout(timerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
  };

  // Sadece start screen'e dön (modal'dan çağrılır)
  const goToStartScreen = () => {
    setScore(0);
    setStreak(0);
    setQuestionCount(0);
    setTimeLeft(300);
    setGameActive(false);
    setGameStarted(false);
    setShowEndModal(false);
    setShowStartScreen(true);
    setResult("");
    setSelectedAnswer("");
    setAllowNext(false);
    setLoading(false);

    // Timer'ları temizle
    if (timerRef.current) clearTimeout(timerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
  };

  useEffect(() => {
    // Sadece kullanıcı giriş yaptıysa istatistikleri yükle (oyunu başlatma)
    if (user?.uid) {
      loadUserStats();
      // loadQuestion(); // Artık otomatik başlamıyor
    }
  }, [user]); // user değiştiğinde yeniden çalıştır

  const getButtonVariant = (option) => {
    if (!result) return "outline-primary";
    if (option === correct) return "success";
    if (option === selectedAnswer && option !== correct) return "danger";
    return "outline-secondary";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 60) return "success";
    if (timeLeft > 30) return "warning";
    return "danger";
  };

  return (
    <>
      <Nav Toggle={Toggle} />

      <Container
        className="py-4"
        style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
      >
        {/* Kullanıcı kontrolü */}
        {!user ? (
          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="text-center shadow">
                <Card.Body className="py-5">
                  <div className="fs-1 mb-3">🔒</div>
                  <h3 className="text-primary mb-3">Login Required</h3>
                  <p className="text-muted mb-4">
                    Please log in to play the game and save your progress!
                  </p>
                  <Button variant="primary" size="lg" href="/login">
                    Go to Login
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <>
            {/* Start Screen */}
            {showStartScreen ? (
              <Card className="border-0 shadow-lg">
                <Card.Body className="p-5 text-center">
                  <div className="mb-4">
                    <div className="fs-1 mb-3">🎯</div>
                    <h2 className="text-primary mb-3">Ready to Play?</h2>
                    <p className="text-muted mb-4 lead">
                      Test your vocabulary skills! Match images with the correct
                      words.
                    </p>
                  </div>

                  {/* User Stats Preview */}
                  <Row className="mb-4 justify-content-center">
                    <Col sm={4}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="py-3">
                          <div className="text-muted small">Best Score</div>
                          <div className="h4 text-success mb-0">
                            {bestScore}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={4}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="py-3">
                          <div className="text-muted small">Games Played</div>
                          <div className="h4 text-info mb-0">
                            {totalGamesPlayed}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Game Rules */}
                  <Row className="mb-4 text-start">
                    <Col lg={8} className="mx-auto">
                      <h5 className="text-dark mb-3">📋 Game Rules:</h5>
                      <ul className="text-muted">
                        <li>
                          You have <strong>5 minutes</strong> to answer as many
                          questions as possible
                        </li>
                        <li>
                          Each question has <strong>30 seconds</strong> time
                          limit
                        </li>
                        <li>
                          Correct answers give you <strong>+10 points</strong>
                        </li>
                        <li>
                          Wrong answers will play the correct pronunciation
                        </li>
                        <li>Build your streak for bonus recognition!</li>
                      </ul>
                    </Col>
                  </Row>

                  <Button
                    variant="primary"
                    size="lg"
                    className="px-5 py-3 fw-bold"
                    onClick={startNewGame}
                  >
                    🚀 Start Game
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              <>
                {/* Header Section - Sadece oyun başladığında göster */}
                <Row className="mb-4">
                  <Col lg={6}>
                    <div className="text-dark">
                      <h1 className="display-4 fw-bold mb-2 text-primary">
                        🎯 Word Vision Challenge
                      </h1>
                      <p className="lead mb-0 text-muted">
                        Match the image with the correct word!
                      </p>
                    </div>
                  </Col>
                  <Col lg={6}>
                    <Row className="g-2">
                      <Col sm={4}>
                        <Card className="border-0 bg-primary text-white text-center h-100 shadow-sm">
                          <Card.Body className="py-3">
                            <div className="fs-4">🎯</div>
                            <div className="small text-uppercase opacity-75">
                              Score
                            </div>
                            <div className="h5 mb-0 fw-bold">{score}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col sm={4}>
                        <Card className="border-0 bg-warning text-white text-center h-100 shadow-sm">
                          <Card.Body className="py-3">
                            <div className="fs-4">🔥</div>
                            <div className="small text-uppercase opacity-75">
                              Streak
                            </div>
                            <div className="h5 mb-0 fw-bold">{streak}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col sm={4}>
                        <Card
                          className={`border-0 bg-${getTimeColor()} text-white text-center h-100 shadow-sm`}
                        >
                          <Card.Body className="py-3">
                            <div className="fs-4">⏱️</div>
                            <div className="small text-uppercase opacity-75">
                              Time
                            </div>
                            <div className="h5 mb-0 fw-bold">
                              {formatTime(timeLeft)}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                {/* Main Game Content */}
                <Card className="border-0 shadow-lg">
                  <Card.Body className="p-4">
                    {!gameActive ? (
                      <div className="text-center py-5">
                        <h3 className="text-danger mb-3">⏰ Time's Up!</h3>
                        <p className="text-muted">
                          Click "End Game" to see your results!
                        </p>
                        <Button variant="danger" size="lg" onClick={endGame}>
                          End Game
                        </Button>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-5">
                        <Spinner
                          animation="border"
                          variant="primary"
                          style={{ width: "4rem", height: "4rem" }}
                          className="mb-4"
                        />
                        <h3 className="h4 mb-2">Loading your challenge...</h3>
                        <p className="text-muted">
                          Finding the perfect image and words for you!
                        </p>
                        <ProgressBar
                          animated
                          now={75}
                          className="mx-auto"
                          style={{ maxWidth: "300px", height: "8px" }}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Game Controls */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Badge bg="primary" className="fs-6 px-3 py-2">
                            Question #{questionCount}
                          </Badge>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={backToStartScreen}
                          >
                            ✕ Exit Game
                          </Button>
                        </div>

                        {/* Image Section */}
                        <Row className="justify-content-center mb-4">
                          <Col xs={12} md={8} lg={6}>
                            <div className="position-relative">
                              <div
                                className="position-absolute top-0 end-0 m-3 z-3"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  background: "#00ff88",
                                  borderRadius: "50%",
                                  boxShadow: "0 0 15px rgba(0, 255, 136, 0.7)",
                                  animation: "pulse 2s infinite",
                                }}
                              ></div>
                              {imageUrl && (
                                <Image
                                  src={imageUrl}
                                  alt="Challenge"
                                  fluid
                                  rounded
                                  className="shadow-lg w-100"
                                  style={{
                                    aspectRatio: "1",
                                    objectFit: "cover",
                                    maxHeight: "350px",
                                  }}
                                />
                              )}
                            </div>
                          </Col>
                        </Row>

                        {/* Options Section */}
                        <Row className="justify-content-center mb-4">
                          <Col lg={8}>
                            <Row className="g-3">
                              {options.map((option, idx) => (
                                <Col xs={12} sm={6} key={idx}>
                                  <Button
                                    variant={getButtonVariant(option)}
                                    size="lg"
                                    className="w-100 py-3 fw-semibold text-capitalize position-relative overflow-hidden"
                                    onClick={() => handleAnswer(option)}
                                    disabled={!!result || !gameActive}
                                    style={{
                                      minHeight: "60px",
                                      transition: "all 0.3s ease",
                                      transform:
                                        result && option === correct
                                          ? "scale(1.02)"
                                          : "scale(1)",
                                    }}
                                  >
                                    {option}
                                    {result && option === correct && (
                                      <span className="position-absolute top-50 end-0 translate-middle-y me-3">
                                        ✅
                                      </span>
                                    )}
                                    {result &&
                                      option === selectedAnswer &&
                                      option !== correct && (
                                        <span className="position-absolute top-50 end-0 translate-middle-y me-3">
                                          ❌
                                        </span>
                                      )}
                                  </Button>
                                </Col>
                              ))}
                            </Row>
                          </Col>
                        </Row>

                        {/* Result Section */}
                        {result && (
                          <Row className="justify-content-center mb-4">
                            <Col lg={6}>
                              <Alert
                                variant={
                                  result === "correct" ? "success" : "warning"
                                }
                                className="text-center border-0 shadow-sm"
                              >
                                <div className="fs-1 mb-2">
                                  {result === "correct" ? "🎉" : "💪"}
                                </div>
                                <Alert.Heading>
                                  {result === "correct"
                                    ? "Fantastic!"
                                    : "Keep Learning!"}
                                </Alert.Heading>
                                <p className="mb-2">
                                  {result === "correct"
                                    ? "You got it right! Well done!"
                                    : `The correct answer was "${correct}". Listen and learn!`}
                                </p>

                                {result === "correct" && streak > 1 && (
                                  <Badge
                                    bg="warning"
                                    className="fs-6 px-3 py-2 mt-2"
                                  >
                                    🔥 {streak} in a row!
                                  </Badge>
                                )}
                              </Alert>
                            </Col>
                          </Row>
                        )}

                        {/* Next Button */}
                        {result && gameActive && (
                          <div className="text-center">
                            <Button
                              variant={allowNext ? "primary" : "warning"}
                              size="lg"
                              className="px-5 py-3 fw-bold"
                              onClick={loadQuestion}
                              disabled={!allowNext}
                              style={{
                                minWidth: "200px",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {allowNext ? (
                                <>
                                  Next Challenge <span className="ms-2">→</span>
                                </>
                              ) : (
                                <>🔊 Listen to continue...</>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>

                {/* Progress Section */}
                {questionCount > 1 && gameActive && (
                  <Row className="mt-4">
                    <Col lg={8} className="mx-auto">
                      <Card className="border-0 bg-light">
                        <Card.Body className="text-center py-3">
                          <div className="small mb-2 text-muted">
                            Your Progress
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-dark">
                              Questions: {questionCount}
                            </span>
                            <span className="text-dark">
                              Accuracy:{" "}
                              {Math.round((score / (questionCount * 10)) * 100)}
                              %
                            </span>
                            <span className="text-dark">
                              Best Score: {bestScore}
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Game End Modal */}
      <Modal show={showEndModal} onHide={() => {}} backdrop="static" centered>
        <Modal.Header className="bg-primary text-white">
          <Modal.Title>🎮 Game Over!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-4">
            <div className="fs-1 mb-3">
              {score > bestScore
                ? "🏆"
                : score >= bestScore * 0.8
                ? "🎉"
                : "💪"}
            </div>
            <h4 className="text-primary">
              {score > bestScore ? "New Record!" : "Great Job!"}
            </h4>
          </div>

          {/* Ana Score Kartları */}
          <Row className="mb-4 justify-content-center">
            <Col sm={6}>
              <Card className="border-2 border-primary">
                <Card.Body className="py-4">
                  <div className="text-muted small mb-1">Current Score</div>
                  <div className="display-4 text-primary fw-bold mb-2">
                    {score}
                  </div>
                  {score > bestScore && (
                    <Badge bg="success" className="fs-6">
                      🎉 New Record!
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6}>
              <Card className="border-2 border-success">
                <Card.Body className="py-4">
                  <div className="text-muted small mb-1">Best Score</div>
                  <div className="display-4 text-success fw-bold mb-2">
                    {Math.max(score, bestScore)}
                  </div>
                  {score === bestScore && bestScore > 0 && (
                    <Badge bg="warning" className="fs-6">
                      🔥 Tied!
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Detay İstatistikleri */}
          <Row className="g-3 mb-4">
            <Col sm={6}>
              <Card className="border-0 bg-light">
                <Card.Body>
                  <div className="text-muted small">Questions Answered</div>
                  <div className="h4 text-info mb-0">{questionCount}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6}>
              <Card className="border-0 bg-light">
                <Card.Body>
                  <div className="text-muted small">Accuracy</div>
                  <div className="h4 text-warning mb-0">
                    {questionCount > 0
                      ? Math.round((score / (questionCount * 10)) * 100)
                      : 0}
                    %
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="text-muted small">
            Total Games Played: {totalGamesPlayed + 1}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={goToStartScreen}
            className="flex-fill"
          >
            ✕ Exit to Menu
          </Button>
          <Button
            variant="primary"
            onClick={startNewGame}
            className="flex-fill"
          >
            🚀 Play Again
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Game;
