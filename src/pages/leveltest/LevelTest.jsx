import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  ProgressBar,
  Badge,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useUserAuth } from "../../context/UserAuthContext";
// JSON dosyasını doğru şekilde import et
import testData from "../../data/english_level_test.json";

import Nav from "../../components/Nav";

const levelScores = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const levelColors = {
  A1: "success",
  A2: "primary",
  B1: "warning",
  B2: "info",
  C1: "danger",
  C2: "dark",
};

const levelDescriptions = {
  A1: "Başlangıç seviyesi - Temel kelimeler ve basit cümleler",
  A2: "Temel seviye - Günlük konuşmalar ve basit metinler",
  B1: "Orta seviye - Genel konularda anlayış ve ifade",
  B2: "Orta-üst seviye - Karmaşık metinler ve akıcı iletişim",
  C1: "İleri seviye - Zorlu metinler ve etkili iletişim",
  C2: "Uzman seviye - Ana dil seviyesinde yetkinlik",
};

// Random soru seçimi için konfigürasyon
const questionConfig = {
  A1: 8,
  A2: 8,
  B1: 8,
  B2: 8,
  C1: 10,
  C2: 10,
};

export function getLevelFromScore(score) {
  if (score <= 25) return "A1";
  if (score <= 45) return "A2";
  if (score <= 70) return "B1";
  if (score <= 95) return "B2";
  if (score <= 120) return "C1";
  return "C2";
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomQuestions(allQuestions, config) {
  const selectedQuestions = [];

  Object.entries(config).forEach(([level, count]) => {
    const levelQuestions = allQuestions.filter((q) => q.level === level);
    const shuffled = shuffleArray(levelQuestions);
    selectedQuestions.push(...shuffled.slice(0, count));
  });

  return shuffleArray(selectedQuestions);
}

// Test Başlama Ekranı Componenti
const TestStartScreen = ({ onStartTest, Toggle }) => {
  const { user } = useUserAuth();
  const totalQuestions = Object.values(questionConfig).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <>
      <Nav Toggle={Toggle} />
      <Container
        fluid
        className="p-4"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-5">
                  <div
                    className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <span className="text-white" style={{ fontSize: "3rem" }}>
                      🎯
                    </span>
                  </div>
                  <h1 className="fw-bold text-dark mb-3">
                    İngilizce Seviye Testi
                  </h1>
                  <p className="text-muted fs-5">
                    İngilizce seviyenizi keşfedin ve öğrenme yolculuğunuzu
                    planlayın
                  </p>
                  {user && (
                    <Badge bg="success" className="fs-6 px-3 py-2">
                      Hoş geldin, {user.displayName || user.email}!
                    </Badge>
                  )}
                </div>

                {/* Test Bilgileri */}
                <Row className="g-4 mb-5">
                  <Col md={4}>
                    <Card className="h-100 border-0 bg-light">
                      <Card.Body className="text-center p-4">
                        <div
                          className="text-primary mb-3"
                          style={{ fontSize: "2.5rem" }}
                        >
                          📝
                        </div>
                        <h5 className="fw-bold text-dark mb-2">
                          {totalQuestions} Soru
                        </h5>
                        <p className="text-muted mb-0 small">
                          A1'den C2'ye kadar tüm seviyeleri kapsayan sorular
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 border-0 bg-light">
                      <Card.Body className="text-center p-4">
                        <div
                          className="text-warning mb-3"
                          style={{ fontSize: "2.5rem" }}
                        >
                          ⏱️
                        </div>
                        <h5 className="fw-bold text-dark mb-2">~15 Dakika</h5>
                        <p className="text-muted mb-0 small">
                          Her soru için 30 saniye süreniz var
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 border-0 bg-light">
                      <Card.Body className="text-center p-4">
                        <div
                          className="text-success mb-3"
                          style={{ fontSize: "2.5rem" }}
                        >
                          🏆
                        </div>
                        <h5 className="fw-bold text-dark mb-2">Anında Sonuç</h5>
                        <p className="text-muted mb-0 small">
                          Seviyenizi hemen öğrenin ve kaydedilsin
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Seviye Açıklamaları */}
                <div className="mb-5">
                  <h4 className="fw-bold text-dark mb-4 text-center">
                    📊 Seviye Açıklamaları
                  </h4>
                  <Row className="g-3">
                    {Object.entries(levelDescriptions).map(
                      ([level, description]) => (
                        <Col md={6} key={level}>
                          <div className="d-flex align-items-center p-3 bg-light rounded-3">
                            <Badge
                              bg={levelColors[level]}
                              className="me-3 px-3 py-2 fs-6"
                            >
                              {level}
                            </Badge>
                            <small className="text-muted">{description}</small>
                          </div>
                        </Col>
                      )
                    )}
                  </Row>
                </div>

                {/* Test Kuralları */}
                <Card className="bg-info bg-opacity-10 border-0 mb-5">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold text-dark mb-3">
                      📋 Test Kuralları
                    </h5>
                    <ul className="list-unstyled mb-0">
                      <li className="d-flex align-items-start mb-2">
                        <span className="text-primary me-2">✓</span>
                        <span>Her soru için 30 saniye süreniz var</span>
                      </li>
                      <li className="d-flex align-items-start mb-2">
                        <span className="text-primary me-2">✓</span>
                        <span>
                          Süre bittiğinde otomatik olarak sonraki soruya geçilir
                        </span>
                      </li>
                      <li className="d-flex align-items-start mb-2">
                        <span className="text-primary me-2">✓</span>
                        <span>Cevapladıktan sonra geri dönüş yapılamaz</span>
                      </li>
                      <li className="d-flex align-items-start mb-2">
                        <span className="text-primary me-2">✓</span>
                        <span>
                          Test sonuçlarınız otomatik olarak kaydedilir
                        </span>
                      </li>
                      <li className="d-flex align-items-start">
                        <span className="text-warning me-2">⚠️</span>
                        <span>Sayfayı yenilemeyin veya geri gitmeyin</span>
                      </li>
                    </ul>
                  </Card.Body>
                </Card>

                {/* Başlat Butonu */}
                <div className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onStartTest}
                    className="px-5 py-3 fw-bold"
                    style={{
                      fontSize: "1.1rem",
                      borderRadius: "25px",
                      minWidth: "200px",
                    }}
                  >
                    <span className="me-2">🚀</span>
                    Teste Başla
                  </Button>
                  <p className="text-muted small mt-3 mb-0">
                    Hazır olduğunuzda butona tıklayın
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
};

const LevelTest = ({ Toggle }) => {
  const { user } = useUserAuth();
  const [testStarted, setTestStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Kaydetme işleminin sadece bir kez yapılması için ref kullan
  const hasSaved = useRef(false);

  // Test başlatma fonksiyonu
  const startTest = useCallback(() => {
    setLoading(true);

    // Kısa bir loading göster
    setTimeout(() => {
      const selectedQuestions = selectRandomQuestions(testData, questionConfig);
      setQuestions(selectedQuestions);
      setAnswers(new Array(selectedQuestions.length).fill(null));
      setTestStarted(true);
      setLoading(false);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
      console.log("📥 Test başlatıldı. Toplam soru:", selectedQuestions.length);
    }, 1000);
  }, []);

  // Test sonuçlarını sadece bir kez hesapla - useMemo kullanarak
  const testResults = useMemo(() => {
    if (!showResult || questions.length === 0 || answers.length === 0) {
      return null;
    }

    const score = answers.reduce((acc, answer, i) => {
      const q = questions[i];
      const isCorrect = answer === q.correct;
      if (isCorrect) {
        return acc + (levelScores[q.level] || 0);
      }
      return acc;
    }, 0);

    const correctAnswers = answers.filter(
      (answer, i) => answer === questions[i].correct
    ).length;

    const testDuration = Math.floor((Date.now() - startTime) / 1000);
    const level = getLevelFromScore(score);
    const percentage = Math.round((correctAnswers / questions.length) * 100);

    return {
      score,
      level,
      correctAnswers,
      totalQuestions: questions.length,
      percentage,
      totalTime,
      testDuration,
      answers,
      questions,
    };
  }, [showResult, questions, answers, startTime, totalTime]);

  const handleTimeUp = useCallback(() => {
    console.log("⏰ Süre doldu!");
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[current] = null;
      return updatedAnswers;
    });

    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
      setTimeLeft(30);
      setQuestionStartTime(Date.now());
      console.log(`➡️ Sıradaki soru: ${current + 2}`);
    } else {
      console.log("✅ Tüm sorular tamamlandı. Sonuç hesaplanıyor...");
      setShowResult(true);
    }
  }, [current, questions.length]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (
      testStarted &&
      !showResult &&
      !loading &&
      questions.length > 0 &&
      current < questions.length
    ) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [
    testStarted,
    current,
    showResult,
    loading,
    questions.length,
    handleTimeUp,
  ]);

  const handleAnswer = useCallback(
    (selectedOption) => {
      const currentQuestion = questions[current];
      const questionTime = Math.floor((Date.now() - questionStartTime) / 1000);
      setTotalTime((prev) => prev + questionTime);

      console.log(
        `📝 Cevaplandı: "${currentQuestion.question}" → "${selectedOption}" (${questionTime}s)`
      );

      setSelectedAnswer(selectedOption);

      setTimeout(() => {
        const updatedAnswers = [...answers];
        updatedAnswers[current] = selectedOption;
        setAnswers(updatedAnswers);
        setSelectedAnswer(null);

        if (current < questions.length - 1) {
          setCurrent((prev) => prev + 1);
          setTimeLeft(30);
          setQuestionStartTime(Date.now());
          console.log(`➡️ Sıradaki soru: ${current + 2}`);
        } else {
          console.log("✅ Tüm sorular tamamlandı. Sonuç hesaplanıyor...");
          setShowResult(true);
        }
      }, 1000);
    },
    [current, questions, answers, questionStartTime]
  );

  const saveResultToFirebase = useCallback(
    async (testResult) => {
      if (!user || saving || !testResult || hasSaved.current) {
        console.log("Kaydetme atlandı:", {
          user: !!user,
          saving,
          testResult: !!testResult,
          hasSaved: hasSaved.current,
        });
        return;
      }

      setSaving(true);
      setSaveError(null);
      hasSaved.current = true; // Bayrak ayarla

      try {
        const testDataToSave = {
          userId: user.uid,
          userEmail: user.email || "",
          score: Number(testResult.score) || 0,
          level: testResult.level || "A1",
          correctAnswers: Number(testResult.correctAnswers) || 0,
          totalQuestions: Number(testResult.totalQuestions) || 0,
          percentage: Number(testResult.percentage) || 0,
          totalTime: Number(testResult.totalTime) || 0,
          testDuration: Number(testResult.testDuration) || 0,
          answers: Array.isArray(testResult.answers) ? testResult.answers : [],
          questions: Array.isArray(testResult.questions)
            ? testResult.questions.map((q) => ({
                question: q.question || "",
                level: q.level || "A1",
                type: q.type || "unknown",
                correct: q.correct || "",
              }))
            : [],
          completedAt: new Date().toISOString(),
          testVersion: "2.1",
        };

        console.log("🔄 Firebase'e kaydediliyor...");

        const docRef = await addDoc(
          collection(db, "englishLevelTests"),
          testDataToSave
        );

        console.log("✅ Test sonucu Firebase'e kaydedildi:", docRef.id);

        // Kullanıcı profili güncelleme - daha güvenli yaklaşım
        if (user.uid) {
          try {
            const userDocRef = doc(db, "users", user.uid);

            // Önce dokümanın var olup olmadığını kontrol et
            const userDocSnap = await getDoc(userDocRef);

            const userUpdateData = {
              lastEnglishTest: {
                level: testResult.level,
                score: Number(testResult.score),
                completedAt: new Date().toISOString(),
                testId: docRef.id,
              },
              updatedAt: new Date().toISOString(),
            };

            if (userDocSnap.exists()) {
              // Doküman varsa güncelle
              await updateDoc(userDocRef, userUpdateData);
              console.log("✅ Kullanıcı profili güncellendi");
            } else {
              // Doküman yoksa oluştur
              await setDoc(userDocRef, {
                ...userUpdateData,
                createdAt: new Date().toISOString(),
                userId: user.uid,
                email: user.email || "",
              });
              console.log("✅ Kullanıcı profili oluşturuldu");
            }
          } catch (profileError) {
            console.warn(
              "⚠️ Kullanıcı profili güncellenemedi, ama test kaydedildi:",
              profileError.message
            );
          }
        }
      } catch (error) {
        console.error("❌ Firebase kayıt hatası:", error);
        hasSaved.current = false; // Hata durumunda bayrağı sıfırla

        let errorMessage = "Test sonucu kaydedilirken bir hata oluştu.";

        if (error.code === "permission-denied") {
          errorMessage = "Kaydetme izni yok. Lütfen tekrar giriş yapın.";
        } else if (error.code === "unavailable") {
          errorMessage =
            "Bağlantı sorunu. Lütfen internet bağlantınızı kontrol edin.";
        } else if (error.code === "invalid-argument") {
          errorMessage = "Geçersiz veri. Test tekrarlanacak.";
        }

        setSaveError(errorMessage);
      } finally {
        setSaving(false);
      }
    },
    [user, saving]
  );

  // Firebase kaydetme - düzeltilmiş dependency array
  useEffect(() => {
    if (testResults && !hasSaved.current) {
      console.log(
        `🏁 Test tamamlandı. Toplam Puan: ${testResults.score}, Seviye: ${testResults.level}`
      );
      saveResultToFirebase(testResults);
    }
  }, [testResults, saveResultToFirebase]);

  const restartTest = useCallback(() => {
    setTestStarted(false);
    setQuestions([]);
    setCurrent(0);
    setAnswers([]);
    setShowResult(false);
    setSelectedAnswer(null);
    setStartTime(null);
    setQuestionStartTime(null);
    setTimeLeft(30);
    setTotalTime(0);
    setSaveError(null);
    setSaving(false);
    hasSaved.current = false; // Bayrağı sıfırla
    console.log("🔄 Test yeniden başlatıldı.");
  }, []);

  const retryFirebaseSave = useCallback(() => {
    if (testResults && !saving) {
      hasSaved.current = false; // Bayrağı sıfırla
      setSaveError(null);
      saveResultToFirebase(testResults);
    }
  }, [testResults, saving, saveResultToFirebase]);

  // Test başlamamışsa başlama ekranını göster
  if (!testStarted) {
    return <TestStartScreen onStartTest={startTest} Toggle={Toggle} />;
  }

  if (loading) {
    return (
      <div
        className="w-100 d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" />
          <p className="mt-2">Test hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (showResult && testResults) {
    return (
      <>
        <Nav Toggle={Toggle} />
        <Container
          fluid
          className="p-4"
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div
                      className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <span
                        className="text-white"
                        style={{ fontSize: "2.5rem" }}
                      >
                        🏆
                      </span>
                    </div>
                    <h2 className="fw-bold text-dark mb-2">Test Sonucu</h2>
                    <p className="text-muted">Sonuçlarınız hazır</p>

                    {saving && (
                      <Alert
                        variant="info"
                        className="d-flex align-items-center"
                      >
                        <Spinner size="sm" className="me-2" />
                        Sonuçlarınız kaydediliyor...
                      </Alert>
                    )}

                    {saveError && (
                      <Alert variant="danger">
                        {saveError}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2"
                          onClick={retryFirebaseSave}
                          disabled={saving}
                        >
                          Tekrar Dene
                        </Button>
                      </Alert>
                    )}

                    {!saving && !saveError && hasSaved.current && (
                      <Alert variant="success">
                        ✅ Sonuçlarınız başarıyla kaydedildi!
                      </Alert>
                    )}
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-3">
                      <Card className="bg-primary text-white h-100 border-0">
                        <Card.Body className="text-center p-4">
                          <span
                            className="d-block mb-2"
                            style={{ fontSize: "2rem" }}
                          >
                            🎯
                          </span>
                          <h3 className="fw-bold mb-1">{testResults.score}</h3>
                          <small className="opacity-75">Toplam Puan</small>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="col-md-3">
                      <Card className="bg-success text-white h-100 border-0">
                        <Card.Body className="text-center p-4">
                          <span
                            className="d-block mb-2"
                            style={{ fontSize: "2rem" }}
                          >
                            ✅
                          </span>
                          <h3 className="fw-bold mb-1">
                            {testResults.correctAnswers}/
                            {testResults.totalQuestions}
                          </h3>
                          <small className="opacity-75">Doğru Cevap</small>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="col-md-3">
                      <Card className="bg-info text-white h-100 border-0">
                        <Card.Body className="text-center p-4">
                          <span
                            className="d-block mb-2"
                            style={{ fontSize: "2rem" }}
                          >
                            ⏰
                          </span>
                          <h3 className="fw-bold mb-1">
                            {Math.floor(testResults.testDuration / 60)}
                          </h3>
                          <small className="opacity-75">Dakika</small>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="col-md-3">
                      <Card className="bg-warning text-white h-100 border-0">
                        <Card.Body className="text-center p-4">
                          <span
                            className="d-block mb-2"
                            style={{ fontSize: "2rem" }}
                          >
                            📊
                          </span>
                          <h3 className="fw-bold mb-1">
                            %{testResults.percentage}
                          </h3>
                          <small className="opacity-75">Başarı</small>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <Badge
                      bg={levelColors[testResults.level]}
                      className="fs-5 px-4 py-2 mb-3"
                    >
                      Tahmini Seviyen: {testResults.level}
                    </Badge>
                    <p className="text-muted mb-3">
                      {levelDescriptions[testResults.level]}
                    </p>
                    <ProgressBar
                      now={testResults.percentage}
                      variant="success"
                      className="mb-2"
                      style={{ height: "12px" }}
                    />
                    <small className="text-muted">
                      Başarı Oranı: %{testResults.percentage}
                    </small>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={restartTest}
                      className="px-4 py-2"
                      disabled={saving}
                    >
                      <span className="me-2">🔄</span>
                      Testi Yeniden Başlat
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Container>
      </>
    );
  }

  const question = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);
  const timePercentage = (timeLeft / 30) * 100;

  return (
    <>
      <Nav Toggle={Toggle} />
      <Container
        fluid
        className="p-4"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* Header Card */}
            <Card className="shadow-lg border-0 rounded-4 mb-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <div>
                      <h4 className="mb-0 fw-bold text-dark">
                        İngilizce Seviye Testi
                      </h4>
                      <small className="text-muted">
                        Seviyenizi belirleyin - {questions.length} soru
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-primary fw-bold">
                      {current + 1}/{questions.length}
                    </div>
                    <small className="text-muted">Soru</small>
                  </div>
                </div>

                <div className="position-relative mb-3">
                  <ProgressBar
                    now={progress}
                    variant="primary"
                    className="mb-1"
                    style={{ height: "8px", borderRadius: "10px" }}
                  />
                  <small className="text-muted">{progress}% tamamlandı</small>
                </div>

                {/* Timer */}
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <div
                      className={`fw-bold ${
                        timeLeft <= 5
                          ? "text-danger"
                          : timeLeft <= 10
                          ? "text-warning"
                          : "text-success"
                      }`}
                      style={{ fontSize: "1.2rem" }}
                    >
                      ⏱️ {timeLeft}s
                    </div>
                    <ProgressBar
                      now={timePercentage}
                      variant={
                        timeLeft <= 5
                          ? "danger"
                          : timeLeft <= 10
                          ? "warning"
                          : "success"
                      }
                      style={{ height: "4px", width: "100px" }}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Question Card */}
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-4">
                    <Badge
                      bg={levelColors[question.level]}
                      className="me-3 px-3 py-2"
                    >
                      Seviye: {question.level}
                    </Badge>
                    <small className="text-muted">{question.type}</small>
                  </div>
                  <h4 className="fw-semibold lh-base text-dark mb-0">
                    {question.question}
                  </h4>
                </div>

                <div className="row g-3">
                  {question.options.map((option, idx) => (
                    <div key={idx} className="col-md-6">
                      <Button
                        variant={
                          selectedAnswer === option
                            ? option === question.correct
                              ? "success"
                              : "danger"
                            : selectedAnswer !== null
                            ? option === question.correct
                              ? "success"
                              : "outline-secondary"
                            : "outline-primary"
                        }
                        size="lg"
                        onClick={() => handleAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className="w-100 text-start p-3"
                        style={{
                          transition: "all 0.3s ease",
                          transform:
                            selectedAnswer === option
                              ? "scale(1.02)"
                              : "scale(1)",
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <span
                            className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3 text-dark fw-bold"
                            style={{
                              width: "32px",
                              height: "32px",
                              fontSize: "14px",
                            }}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="fw-medium">{option}</span>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
};

export default LevelTest;
