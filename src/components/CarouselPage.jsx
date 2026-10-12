import React, { useCallback } from "react";
import Carousel from "react-bootstrap/Carousel";

const slides = [
  {
    title: "Vocabulary",
    description: "Expand your vocabulary and improve your language skills.",
    imgUrl:
      "https://jbmsmartstart.in/wp-content/uploads/2022/08/vocabulary-word-chalkboard-with-school-supplies-1600x900-1-1200x675.webp",
    link: "/vocabulary",
  },
  {
    title: "Listening",
    description: "Improve your listening skills with engaging audio exercises.",
    imgUrl:
      "https://blueskyconsultancy.com/wp-content/uploads/2023/09/ielts-listening.svg",
    link: "/listening",
  },
  {
    title: "Level Test",
    description:
      "Start your journey and assess your level using EngageEnglish.",
    imgUrl:
      "https://www.novakid.com.tr/blog/wp-content/uploads/2022/06/Ingilizce-seviyeleri-1.webp",
    link: "/leveltest",
  },
];

function CarouselPage() {
  const handleSlideClick = useCallback((link) => {
    window.location.href = link;
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.style.backgroundColor = "#f8f9fa";
    e.target.alt = "Image could not be loaded";
  }, []);

  return (
    <div className="container-fluid p-0">
      <Carousel
        fade
        interval={5000}
        pause="hover"
        indicators={true}
        controls={true}
      >
        {slides.map((slide, index) => (
          <Carousel.Item key={index}>
            <div className="position-relative" style={{ height: "90vh" }}>
              <img
                src={slide.imgUrl}
                alt={`${slide.title} slide`}
                className="w-100 h-100 object-fit-cover"
                style={{
                  filter: "brightness(0.6)",
                  transition: "filter 0.3s ease",
                }}
                onError={handleImageError}
                loading="lazy"
              />
              <div
                className="position-absolute bottom-0 start-50 translate-middle-x bg-light bg-opacity-80 p-4 rounded-3 shadow-lg text-center mb-4"
                style={{
                  zIndex: 100,
                  cursor: "pointer",
                  maxWidth: "90%",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onClick={() => handleSlideClick(slide.link)}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateX(-50%) scale(1.02)";
                  e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateX(-50%) scale(1)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSlideClick(slide.link);
                  }
                }}
                aria-label={`Go to ${slide.title} section`}
              >
                <h3
                  className="fw-bold mb-2 text-dark"
                  style={{ fontSize: "1.5rem" }}
                >
                  {slide.title}
                </h3>
                <p
                  className="fw-normal mb-0 text-dark"
                  style={{ fontSize: "1rem" }}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}

export default CarouselPage;
