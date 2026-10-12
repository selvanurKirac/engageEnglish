import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";

const BusinessVideos = () => {
  const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;
  const { term } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const query = encodeURIComponent(`${term} business english`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=15&type=video&key=${API_KEY}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items) {
          setVideos(data.items);
        }
      } catch (error) {
        console.error("YouTube API error:", error);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [term]);

  return (
    <Container className="mt-4">
      <h3 className="mb-3">
        🎥 YouTube Videoları: <i>{decodeURIComponent(term)}</i>
      </h3>
      <Button
        as={Link}
        to="/business-english"
        variant="secondary"
        className="mb-3"
      >
        ← Geri Dön
      </Button>

      {loading ? (
        <Spinner animation="border" role="status" />
      ) : (
        <Row>
          {videos.map((video) => (
            <Col key={video.id.videoId} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div>
                    <Card.Title style={{ minHeight: "3em" }}>
                      {video.snippet.title}
                    </Card.Title>
                  </div>
                  <div className="mt-auto">
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${video.id.videoId}`}
                      title={video.snippet.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default BusinessVideos;
