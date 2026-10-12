import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import listeningData from "./finaljson.json";
import Nav from "../../components/Nav";

function Detail({ Toggle }) {
  const { level, index } = useParams();
  const data = listeningData[level]?.[index];

  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptRef = useRef(null);

  if (!data)
    return <div className="container mt-5">Böyle bir içerik bulunamadı.</div>;

  const hasMultipleChoice =
    Array.isArray(data.question) && Array.isArray(data.options);
  const totalMCQuestions = hasMultipleChoice ? data.question.length : 0;

  const hasTrueFalse =
    Array.isArray(data.questiontf) && Array.isArray(data.optionstf);
  const totalTFQuestions = hasTrueFalse ? data.questiontf.length : 0;

  const [mcIndex, setMcIndex] = useState(0);
  const [selectedMCOptions, setSelectedMCOptions] = useState(
    Array(totalMCQuestions).fill(null)
  );
  const [mcResults, setMcResults] = useState([]);
  const [showMCResults, setShowMCResults] = useState(false);

  const [selectedTFOptions, setSelectedTFOptions] = useState(
    Array(totalTFQuestions).fill(null)
  );
  const [tfResults, setTFResults] = useState([]);
  const [showTFResults, setShowTFResults] = useState(false);

  // --- Çoktan Seçmeli ---
  const handleMCOptionChange = (value) => {
    const updated = [...selectedMCOptions];
    updated[mcIndex] = value;
    setSelectedMCOptions(updated);
  };

  const finishMC = () => {
    const results = selectedMCOptions.map(
      (ans, i) =>
        ans?.toLowerCase().trim() === data.answers[i]?.toLowerCase().trim()
    );
    setMcResults(results);
    setShowMCResults(true);
  };

  // --- True/False ---
  const handleTFChange = (value, i) => {
    const updated = [...selectedTFOptions];
    updated[i] = value;
    setSelectedTFOptions(updated);
  };

  const finishTF = () => {
    const results = selectedTFOptions.map(
      (ans, i) => ans === data.answerstf[i]
    );
    setTFResults(results);
    setShowTFResults(true);
  };

  const toggleTranscript = () => setShowTranscript((prev) => !prev);

  useEffect(() => {
    const content = transcriptRef.current;
    if (content) {
      content.style.maxHeight = showTranscript
        ? content.scrollHeight + "px"
        : "0px";
      content.style.opacity = showTranscript ? "1" : "0";
    }
  }, [showTranscript]);

  return (
    <>
      <Nav Toggle={Toggle} />
      <div className="container mt-2" style={{background:"rgb(242, 247, 250)"}}>
        <Link to="/listening" className="btn btn-secondary mb-4 mt-2">
          ← Geri Dön
        </Link>
        <h3>{data.title}</h3>
        <div className="row">
          {" "}
          <img
            src={data.image}
            alt={data.title}
            className="img-fluid rounded-start"
            style={{
              width: "100%", // Tüm genişliği kapla
              maxWidth: "600px", // Maksimum genişlik belirle
              height: "auto", // Oranlı yükseklik
              objectFit: "cover", // Taşma durumlarını kontrol et
              marginBottom: "20px", // Estetik boşluk
            }}
          />
        </div>

        <audio controls className="my-3">
          <source src={data.audio} type="audio/mp3" />
          Tarayıcınız ses dosyasını desteklemiyor.
        </audio>

        <div
          onClick={toggleTranscript}
          style={{
            backgroundColor: "#e2dfea",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#2f1a5d",
            userSelect: "none",
          }}
        >
          Transcript {showTranscript ? "▲" : "▼"}
        </div>
        <div
          ref={transcriptRef}
          style={{
            maxHeight: "0px",
            overflow: "hidden",
            transition: "max-height 0.6s ease, opacity 0.6s ease",
            opacity: 0,
            backgroundColor: "#f9f9f9",
            padding: showTranscript ? "10px" : "0 10px",
            borderRadius: "5px",
            marginBottom: "50px",
          }}
        >
          {data.script?.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "5px 0" }}>
              {line}
            </p>
          ))}
        </div>

        {/* Çoktan Seçmeli Sorular */}
        {hasMultipleChoice && (
          <div
            className="mb-5"
            style={{
              border: "2px solid",
              borderRadius: "5px",
              padding: "20px",
              background: "aliceblue",
            }}
          >
            <h4>
              Question {mcIndex + 1}{" "}
              {showMCResults && (
                <>
                  {mcResults[mcIndex] ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      ✔
                    </span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>✘</span>
                  )}
                </>
              )}
            </h4>
            <p>{data.question[mcIndex]}</p>

            {data.options[mcIndex].map((option, i) => {
              const isCorrect =
                data.answers[mcIndex]?.toLowerCase().trim() ===
                option.toLowerCase().trim();
              const isSelected =
                selectedMCOptions[mcIndex]?.toLowerCase().trim() ===
                option.toLowerCase().trim();
              return (
                <div key={i}>
                  <label
                    style={{
                      backgroundColor:
                        showMCResults && isCorrect ? "#d4edda" : undefined,
                      padding: "5px 10px",
                      borderRadius: "4px",
                      display: "inline-block",
                      marginBottom: "5px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name={`mc-${mcIndex}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleMCOptionChange(option)}
                      disabled={showMCResults}
                      style={{ marginRight: "8px" }}
                      className="form-check-input"
                    />
                    {option}
                  </label>
                </div>
              );
            })}

            <div className="mt-3 d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-2"
                onClick={() => setMcIndex(mcIndex - 1)}
                disabled={mcIndex === 0}
              >
                ←
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                {data.question.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      backgroundColor: mcIndex === i ? "#a6ce39" : "#4e7306",
                      transition: "background-color 0.3s ease",
                    }}
                  />
                ))}
              </div>

              <button
                className="btn btn-outline-secondary ms-2"
                onClick={() => setMcIndex(mcIndex + 1)}
                disabled={mcIndex === totalMCQuestions - 1}
              >
                →
              </button>
            </div>

            {!showMCResults && (
              <div className="mt-3">
                <button
                  className="btn btn-success me-2"
                  onClick={finishMC}
                  disabled={selectedMCOptions.includes(null)}
                >
                  ✔ Finish
                </button>
                {selectedMCOptions.includes(null) && (
                  <span className="text-danger">Tüm soruları cevaplayın.</span>
                )}
              </div>
            )}

            {showMCResults && (
              <div className="mt-3">
                <button
                  className="btn btn-outline-success"
                  onClick={() => {
                    setMcIndex(0);
                    setSelectedMCOptions(Array(totalMCQuestions).fill(null));
                    setShowMCResults(false);
                    setMcResults([]);
                  }}
                >
                  ⟲ Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Doğru / Yanlış Sorular */}
        {hasTrueFalse && (
          <div
            className="mb-5"
            style={{
              border: "2px solid",
              borderRadius: "5px",
              padding: "20px",
              background: "lightyellow",
            }}
          >
            <h4>True / False Questions</h4>
            {data.questiontf.map((q, i) => (
              <div key={i} className="mb-3">
                <p>
                  {q}{" "}
                  {showTFResults &&
                    (tfResults[i] ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        ✔
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        ✘
                      </span>
                    ))}
                  {["True", "False"].map((opt) => (
                    <label key={opt} style={{ marginRight: "15px" }}>
                      <input
                        type="checkbox"
                        name={`tf-${i}`}
                        value={opt}
                        checked={selectedTFOptions[i] === opt}
                        onChange={() => handleTFChange(opt, i)}
                        disabled={showTFResults}
                        style={{ marginRight: "5px" }}
                        className="form-check-input"
                      />
                      {opt}
                    </label>
                  ))}
                </p>
              </div>
            ))}

            {!showTFResults && (
              <div className="mt-3">
                <button
                  className="btn btn-success me-2"
                  onClick={finishTF}
                  disabled={selectedTFOptions.includes(null)}
                >
                  ✔ Finish
                </button>
                {selectedTFOptions.includes(null) && (
                  <span className="text-danger">Tüm soruları cevaplayın.</span>
                )}
              </div>
            )}

            {showTFResults && (
              <div className="mt-3">
                <button
                  className="btn btn-outline-success"
                  onClick={() => {
                    setSelectedTFOptions(Array(totalTFQuestions).fill(null));
                    setShowTFResults(false);
                    setTFResults([]);
                  }}
                >
                  ⟲ Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Detail;
