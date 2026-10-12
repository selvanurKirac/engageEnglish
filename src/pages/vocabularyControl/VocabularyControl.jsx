import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Modal,
  ProgressBar,
} from "react-bootstrap";
import Nav from "../../components/Nav";
import { useUserAuth } from "../../context/UserAuthContext";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

const VocabularyControl = ({ Toggle }) => {
  const { user } = useUserAuth();

  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [questionTimeLimit] = useState(30); // Her soru için 30 saniye - sabit
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions] = useState(10); // Toplam 10 soru - sabit

  // Word states
  const [randomWord, setRandomWord] = useState("");
  const [inputWord, setInputWord] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Score states
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  // Hint states
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  // Best score states
  const [bestScore, setBestScore] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  // Timer effect - sadece oyun başladığında ve cevap verilmediğinde çalışır
  useEffect(() => {
    let interval = null;

    // Oyun başladı mı? Bitti mi? Kelime var mı? Cevap verildi mi? kontrol et
    if (
      gameStarted &&
      !gameEnded &&
      randomWord &&
      !isAnswered &&
      timeLeft > 0
    ) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Süre bitti, yanlış cevap say
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameStarted, gameEnded, randomWord, isAnswered, timeLeft]);

  // Load best score on component mount
  useEffect(() => {
    if (user) {
      loadBestScore();
    }
  }, [user]);

  // Speech Synthesis durumunu kontrol et
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const checkVoices = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          const englishVoices = voices.filter((voice) =>
            voice.lang.startsWith("en")
          );
          const qualityVoices = englishVoices.filter(
            (voice) =>
              voice.name.includes("Google") ||
              voice.name.includes("Microsoft") ||
              voice.name.includes("Natural") ||
              voice.name.includes("Premium")
          );
        }
      };

      speechSynthesis.onvoiceschanged = checkVoices;
      checkVoices();
      setTimeout(checkVoices, 1000);
    }
  }, []);

  const loadBestScore = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "vocabularyScores"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let bestScoreValue = 0;
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.score > bestScoreValue) {
            bestScoreValue = data.score;
          }
        });
        setBestScore(bestScoreValue);
      }
    } catch (error) {
      setBestScore(0);
    }
  };

  const handleTimeUp = () => {
    if (isAnswered) return; // Zaten cevap verildiyse bir şey yapma

    setResult(`⏰ Süre bitti! Doğru cevap: "${randomWord}"`);
    setWrongAnswers((prev) => prev + 1);
    setIsAnswered(true);

    // 3 saniye sonra sonraki soruya geç
    setTimeout(() => {
      moveToNextQuestion();
    }, 3000);
  };

  const moveToNextQuestion = () => {
    const nextQuestionNumber = currentQuestionNumber + 1;

    if (nextQuestionNumber >= totalQuestions) {
      // Oyunu bitir
      endGame();
    } else {
      // Sonraki soruya geç
      setCurrentQuestionNumber(nextQuestionNumber);
      fetchRandomWord();
    }
  };

  const startGame = async () => {
    try {
      // Oyun state'lerini başlangıç değerlerine getir
      setGameStarted(true);
      setGameEnded(false);
      setCurrentQuestionNumber(0);
      setScore(0);
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setResult("");
      setSavedToFirebase(false);
      setTimeLeft(questionTimeLimit);

      // İlk kelimeyi yükle
      await fetchRandomWord();
    } catch (error) {
      setGameStarted(false);
      setResult("❌ Oyun başlatılamadı. Lütfen tekrar deneyin.");
    }
  };

  const endGame = () => {
    setGameEnded(true);
    setGameStarted(false);
    setShowResultModal(true);
    saveScoreToFirebase();
  };

  const resetGame = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);

    setGameStarted(false);
    setGameEnded(false);
    setCurrentQuestionNumber(0);
    setTimeLeft(questionTimeLimit);
    setRandomWord("");
    setInputWord("");
    setResult("");
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setShowHint(false);
    setHintLevel(0);
    setIsAnswered(false);
    setShowResultModal(false);
    setSavedToFirebase(false);
  };

  const fetchRandomWord = async () => {
    setIsLoading(true);

    // Önce sesleri durdur
    speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const response = await fetch(
        "https://random-word-api.vercel.app/api?words=1"
      );
      const data = await response.json();
      const newWord = data[0];

      // Kelime state'lerini güncelle
      setRandomWord(newWord);
      setInputWord("");
      setResult("");
      setShowHint(false);
      setHintLevel(0);
      setIsAnswered(false);
      setTimeLeft(questionTimeLimit); // Timer'ı sıfırla

      // Kelime yüklendikten sonra otomatik seslendir
      if (gameStarted && !gameEnded) {
        setTimeout(() => {
          playWordAudio(newWord);
        }, 800);
      }

      return newWord;
    } catch (error) {
      setResult("❌ Kelime yüklenirken hata oluştu!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const playWordAudio = (wordToPlay) => {
    const targetWord = wordToPlay || randomWord;

    if ("speechSynthesis" in window && targetWord && !isSpeaking) {
      setIsSpeaking(true);

      speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(targetWord);

        utterance.lang = "en-US";
        utterance.rate = 0.6;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = speechSynthesis.getVoices();
        const englishVoices = voices.filter(
          (voice) =>
            voice.lang.startsWith("en-") &&
            (voice.name.includes("Google") ||
              voice.name.includes("Microsoft") ||
              voice.name.includes("Natural"))
        );

        if (englishVoices.length > 0) {
          const preferredVoice =
            englishVoices.find(
              (voice) =>
                voice.name.includes("Google") ||
                voice.name.includes("Microsoft")
            ) || englishVoices[0];

          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      }, 500);
    }
  };

  const playWithSpeechSynthesis = () => {
    playWordAudio(randomWord);
  };

  const checkInput = () => {
    if (!inputWord.trim()) {
      setResult("⚠️ Lütfen bir kelime girin!");
      return;
    }

    if (isAnswered) {
      return;
    }

    // Sesi durdur
    speechSynthesis.cancel();
    setIsSpeaking(false);

    // Cevabı kontrol et
    setIsAnswered(true);

    if (inputWord.toLowerCase().trim() === randomWord.toLowerCase()) {
      setResult("✅ Tebrikler! Doğru cevap!");
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setResult(`❌ Yanlış! Doğru cevap: "${randomWord}"`);
      setWrongAnswers((prev) => prev + 1);
    }

    // 2 saniye sonra sonraki soruya geç
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const generateHint = (word, level) => {
    if (!word) return "";

    const wordLength = word.length;
    const stars = "*".repeat(wordLength);

    switch (level) {
      case 1:
        return word.charAt(0) + stars.slice(1);
      case 2:
        const middleIndex = Math.floor(wordLength / 2);
        return (
          stars.slice(0, middleIndex) +
          word.charAt(middleIndex) +
          stars.slice(middleIndex + 1)
        );
      case 3:
        return stars.slice(0, -1) + word.charAt(wordLength - 1);
      case 4:
        const middle = Math.floor(wordLength / 2);
        let hint = stars.split("");
        hint[0] = word.charAt(0);
        if (wordLength > 2) hint[middle] = word.charAt(middle);
        if (wordLength > 1) hint[wordLength - 1] = word.charAt(wordLength - 1);
        return hint.join("");
      default:
        return "";
    }
  };

  const showWordHint = () => {
    if (randomWord && !isAnswered) {
      const nextLevel = hintLevel + 1;
      const maxLevel = randomWord.length > 3 ? 4 : 3;

      if (nextLevel <= maxLevel) {
        setHintLevel(nextLevel);
        const hint = generateHint(randomWord, nextLevel);
        setShowHint(hint);
        setScore((prev) => Math.max(0, prev - 2));
      }
    }
  };

  const saveScoreToFirebase = async () => {
    if (!user || savedToFirebase) return;

    try {
      const totalAttempts = correctAnswers + wrongAnswers;
      const gameData = {
        userId: user.uid,
        userEmail: user.email,
        score: score,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        totalQuestions: currentQuestionNumber,
        totalAttempts: totalAttempts,
        accuracy:
          totalAttempts > 0
            ? Math.round((correctAnswers / totalAttempts) * 100)
            : 0,
        averageTimePerQuestion: questionTimeLimit,
        playedAt: new Date(),
        gameType: "vocabularyControl",
      };

      await addDoc(collection(db, "vocabularyScores"), gameData);
      setSavedToFirebase(true);

      if (score > bestScore) {
        setBestScore(score);
      }
    } catch (error) {
      // Sessizce başarısız ol
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && gameStarted && !gameEnded && !isAnswered) {
      checkInput();
    }
  };

  const getHintButtonText = () => {
    switch (hintLevel) {
      case 0:
        return "💡 İpucu (Baştan)";
      case 1:
        return "💡 İpucu (Ortadan)";
      case 2:
        return "💡 İpucu (Sondan)";
      case 3:
        return "💡 Tüm İpuçları";
      default:
        return "💡 İpucu Bitti";
    }
  };

  const maxHintLevel = randomWord ? (randomWord.length > 3 ? 4 : 3) : 4;
  const timePercentage = (timeLeft / questionTimeLimit) * 100;

  return (
    <Container fluid className="mt-3">
      <Nav Toggle={Toggle} />

      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="display-4 text-primary mb-3">
                🎯 Vocabulary Speed Game
              </h1>
              <p className="lead text-muted">
                Her kelime için 30 saniye süreniz var! {totalQuestions} kelimeyi
                tamamlayın.
              </p>
            </div>

            {/* Best Score & Stats */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="text-center py-3">
                <Row>
                  <Col>
                    <Badge bg="warning" className="fs-6 px-3 py-2">
                      🏆 En İyi: {bestScore}
                    </Badge>
                  </Col>
                  {gameStarted && (
                    <>
                      <Col>
                        <Badge bg="info" className="fs-6 px-3 py-2">
                          📊 Soru: {currentQuestionNumber + 1}/{totalQuestions}
                        </Badge>
                      </Col>
                      <Col>
                        <Badge bg="success" className="fs-6 px-3 py-2">
                          ✅ Doğru: {correctAnswers}
                        </Badge>
                      </Col>
                      <Col>
                        <Badge bg="danger" className="fs-6 px-3 py-2">
                          ❌ Yanlış: {wrongAnswers}
                        </Badge>
                      </Col>
                      <Col>
                        <Badge bg="primary" className="fs-6 px-3 py-2">
                          🎯 Skor: {score}
                        </Badge>
                      </Col>
                    </>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* Timer - sadece oyun başladığında göster */}
            {gameStarted && !gameEnded && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="py-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">⏰ Süre:</span>
                    {!randomWord || isLoading ? (
                      <span className="fw-bold fs-5 text-warning">
                        Hazırlanıyor...
                      </span>
                    ) : (
                      <span
                        className={`fw-bold fs-5 ${
                          timeLeft <= 10 ? "text-danger" : "text-primary"
                        }`}
                      >
                        {timeLeft} saniye
                      </span>
                    )}
                  </div>
                  <ProgressBar
                    now={!randomWord || isLoading ? 100 : timePercentage}
                    variant={
                      !randomWord || isLoading
                        ? "warning"
                        : timeLeft <= 10
                        ? "danger"
                        : timeLeft <= 15
                        ? "warning"
                        : "success"
                    }
                    animated={!randomWord || isLoading || timeLeft <= 10}
                    striped={!randomWord || isLoading}
                  />
                  {(!randomWord || isLoading) && (
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Kelime yükleniyor, süre henüz başlamadı...
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Main Game Card */}
            <Card className="shadow-lg border-0 mb-4">
              <Card.Body className="p-5">
                {!gameStarted && !gameEnded ? (
                  // Start Game Screen
                  <div className="text-center">
                    <div className="mb-4">
                      <h3 className="text-primary mb-3">🎮 Oyuna Başla</h3>
                      <p className="text-muted mb-4">
                        {totalQuestions} kelime için her birinde 30 saniye
                        süreniz var!
                        <br />
                        Her doğru cevap 10 puan kazandırır.
                        <br />
                        İpucu kullanmak 2 puan azaltır.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={startGame}
                      className="px-5 py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Başlatılıyor...
                        </>
                      ) : (
                        "🚀 Oyunu Başlat"
                      )}
                    </Button>
                  </div>
                ) : gameStarted && !gameEnded ? (
                  // Game Screen
                  <>
                    {/* Audio Button */}
                    <div className="text-center mb-4">
                      <Button
                        variant={isSpeaking ? "success" : "outline-primary"}
                        size="lg"
                        className="rounded-circle shadow-sm"
                        style={{ width: "100px", height: "100px" }}
                        onClick={playWithSpeechSynthesis}
                        disabled={isLoading || !randomWord || isSpeaking}
                      >
                        {isLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : isSpeaking ? (
                          <div>
                            <div style={{ fontSize: "2rem" }}>🔊</div>
                            <small>Konuşuyor...</small>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: "2rem" }}>🔊</div>
                            <small>Dinle</small>
                          </div>
                        )}
                      </Button>

                      <div className="mt-2">
                        <small className="text-muted">
                          {randomWord
                            ? `Kelime hazır (${randomWord.length} harf)`
                            : "Kelime yükleniyor..."}
                        </small>
                      </div>
                    </div>

                    {/* Input Section */}
                    <Row className="justify-content-center mb-4">
                      <Col md={8}>
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control form-control-lg text-center fs-4"
                            id="wordInput"
                            value={inputWord}
                            onChange={(e) => setInputWord(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Kelimeyi buraya yazın..."
                            disabled={isLoading || isAnswered}
                            autoFocus
                          />
                          <label htmlFor="wordInput">
                            Kelimeyi buraya yazın...
                          </label>
                        </div>
                      </Col>
                    </Row>

                    {/* Hint Section */}
                    {showHint && (
                      <Alert variant="info" className="text-center mb-4">
                        <div className="d-flex flex-column align-items-center">
                          <div className="mb-2">
                            <strong>💡 İpucu:</strong>
                            <span className="fs-3 mx-3 font-monospace">
                              {showHint}
                            </span>
                          </div>
                          <small className="text-muted">
                            İpucu seviyesi: {hintLevel}/{maxHintLevel} (-2 puan)
                          </small>
                        </div>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <Row className="justify-content-center mb-4">
                      <Col xs="auto" className="mb-2">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={checkInput}
                          disabled={
                            isLoading || !inputWord.trim() || isAnswered
                          }
                          className="px-4"
                        >
                          ✅ Kontrol Et
                        </Button>
                      </Col>
                      <Col xs="auto" className="mb-2">
                        <Button
                          variant="outline-secondary"
                          size="lg"
                          onClick={showWordHint}
                          disabled={
                            isLoading ||
                            !randomWord ||
                            isAnswered ||
                            hintLevel >= maxHintLevel
                          }
                          className="px-4"
                        >
                          {getHintButtonText()}
                        </Button>
                      </Col>
                    </Row>

                    {/* Result */}
                    {result && (
                      <Alert
                        variant={
                          result.includes("✅")
                            ? "success"
                            : result.includes("⚠️")
                            ? "warning"
                            : "danger"
                        }
                        className="text-center fs-5 fw-bold"
                      >
                        {result}
                      </Alert>
                    )}
                  </>
                ) : (
                  // Game Ended Screen
                  <div className="text-center">
                    <h3 className="text-success mb-4">🎉 Oyun Bitti!</h3>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={resetGame}
                      className="px-5"
                    >
                      🔄 Tekrar Oyna
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Result Modal */}
      <Modal
        show={showResultModal}
        onHide={() => setShowResultModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>🎯 Oyun Sonucu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <h2 className="text-primary mb-3">🎉 Tebrikler!</h2>
            <div className="row">
              <div className="col-6">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-success">{score}</h4>
                  <small className="text-muted">Final Skor</small>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-info">{currentQuestionNumber}</h4>
                  <small className="text-muted">Toplam Soru</small>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-success">{correctAnswers}</h4>
                  <small className="text-muted">Doğru Cevap</small>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-danger">{wrongAnswers}</h4>
                  <small className="text-muted">Yanlış Cevap</small>
                </div>
              </div>
              <div className="col-12">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-warning">
                    {correctAnswers + wrongAnswers > 0
                      ? Math.round(
                          (correctAnswers / (correctAnswers + wrongAnswers)) *
                            100
                        )
                      : 0}
                    %
                  </h4>
                  <small className="text-muted">Başarı Oranı</small>
                </div>
              </div>
            </div>
            {score > bestScore && (
              <Alert variant="success" className="mt-3">
                🏆 Yeni rekor! En iyi skorunuzu geçtiniz!
              </Alert>
            )}
            {savedToFirebase && (
              <Alert variant="info" className="mt-3">
                ✅ Skorunuz başarıyla kaydedildi!
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="primary" onClick={resetGame} size="lg">
            🔄 Tekrar Oyna
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => setShowResultModal(false)}
          >
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VocabularyControl;
