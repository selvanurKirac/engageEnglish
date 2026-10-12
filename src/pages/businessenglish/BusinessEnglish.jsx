import React, { useEffect, useState } from "react";
import data from "../../../src/data/businessEnglish.json";
import { Card, Button, Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

const BusinessEnglish = () => {
  const [entries, setEntries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setEntries(data);

    // Kategori listesini otomatik oluştur
    const uniqueCategories = Array.from(
      new Set(data.map((entry) => entry.category))
    ).sort();
    setCategories(uniqueCategories);
  }, []);

  const handleSpeak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  // Filtrelenmiş veriler
  const filteredEntries =
    selectedCategory === "all"
      ? entries
      : entries.filter((entry) => entry.category === selectedCategory);

  return (
    <Container className="mt-4">
      <h2 className="mb-3 text-center">📚 Business English Vocabulary</h2>

      {/* Kategori Seçimi */}
      <Form.Group controlId="categorySelect" className="mb-4">
        <Form.Label>
          <strong>Filter by Sector:</strong>
        </Form.Label>
        <Form.Control
          as="select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      {/* Kartlar */}
      <Row>
        {filteredEntries.map((entry, idx) => (
          <Col key={idx} md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{entry.word}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {entry.category}
                </Card.Subtitle>
                <Card.Text>
                  <strong>Meaning:</strong> {entry.definition}
                </Card.Text>
                <Card.Text>
                  <i>Example: {entry.example}</i>
                </Card.Text>

                <div className="mt-auto d-grid gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleSpeak(entry.word)}
                    className="w-100"
                  >
                    🔊 Listen
                  </Button>
                  <Button
                    as={Link}
                    to={`/business-english/videos/${encodeURIComponent(
                      entry.word
                    )}`}
                    variant="danger"
                    className="w-100"
                  >
                    🎥 YouTube'dan Öğren
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default BusinessEnglish;
