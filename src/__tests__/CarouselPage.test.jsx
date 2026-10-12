// CarouselPage.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import CarouselPage from "../components/CarouselPage";

// react-bootstrap/Carousel'i mock'luyoruz
vi.mock("react-bootstrap/Carousel", () => {
  const MockCarousel = ({ children, ...props }) => (
    <div data-testid="carousel" {...props}>
      {children}
    </div>
  );

  MockCarousel.Item = ({ children, ...props }) => (
    <div data-testid="carousel-item" {...props}>
      {children}
    </div>
  );

  return {
    default: MockCarousel,
  };
});

// window.location.href'i mock'luyoruz
const mockLocation = {
  href: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  configurable: true,
});

describe("CarouselPage Component", () => {
  beforeEach(() => {
    window.location.href = "";
    vi.clearAllMocks();
  });

  test("renders without crashing", () => {
    render(<CarouselPage />);
    expect(screen.getByTestId("carousel")).toBeInTheDocument();
  });

  test("renders all carousel items", () => {
    render(<CarouselPage />);
    const carouselItems = screen.getAllByTestId("carousel-item");
    expect(carouselItems).toHaveLength(3);
  });

  test("renders correct slide titles", () => {
    render(<CarouselPage />);

    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Listening")).toBeInTheDocument();
    expect(screen.getByText("Level Test")).toBeInTheDocument();
  });

  test("renders correct slide descriptions", () => {
    render(<CarouselPage />);

    expect(
      screen.getByText(
        "Expand your vocabulary and improve your language skills."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Improve your listening skills with engaging audio exercises."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start your journey and assess your level using EngageEnglish."
      )
    ).toBeInTheDocument();
  });

  test("renders images with correct alt text", () => {
    render(<CarouselPage />);

    expect(screen.getByAltText("Vocabulary slide")).toBeInTheDocument();
    expect(screen.getByAltText("Listening slide")).toBeInTheDocument();
    expect(screen.getByAltText("Level Test slide")).toBeInTheDocument();
  });

  test("navigates to correct link when slide is clicked", () => {
    render(<CarouselPage />);

    const vocabularySlide = screen
      .getByText("Vocabulary")
      .closest('[role="button"]');
    fireEvent.click(vocabularySlide);
    expect(window.location.href).toBe("/vocabulary");

    const listeningSlide = screen
      .getByText("Listening")
      .closest('[role="button"]');
    fireEvent.click(listeningSlide);
    expect(window.location.href).toBe("/listening");

    const levelTestSlide = screen
      .getByText("Level Test")
      .closest('[role="button"]');
    fireEvent.click(levelTestSlide);
    expect(window.location.href).toBe("/leveltest");
  });

  test("handles keyboard navigation", () => {
    render(<CarouselPage />);

    const vocabularySlide = screen
      .getByText("Vocabulary")
      .closest('[role="button"]');

    // Enter key
    fireEvent.keyDown(vocabularySlide, { key: "Enter" });
    expect(window.location.href).toBe("/vocabulary");

    window.location.href = "";

    // Space key
    fireEvent.keyDown(vocabularySlide, { key: " " });
    expect(window.location.href).toBe("/vocabulary");
  });

  test("does not navigate on other keys", () => {
    render(<CarouselPage />);

    const vocabularySlide = screen
      .getByText("Vocabulary")
      .closest('[role="button"]');
    fireEvent.keyDown(vocabularySlide, { key: "Escape" });
    expect(window.location.href).toBe("");
  });

  test("handles image load error", () => {
    render(<CarouselPage />);

    const image = screen.getByAltText("Vocabulary slide");
    fireEvent.error(image);

    expect(image.style.backgroundColor).toBe("rgb(248, 249, 250)");
    expect(image.alt).toBe("Image could not be loaded");
  });

  test("has correct accessibility attributes", () => {
    render(<CarouselPage />);

    const slides = screen.getAllByRole("button");
    slides.forEach((slide, index) => {
      expect(slide).toHaveAttribute("tabIndex", "0");
      expect(slide).toHaveAttribute("role", "button");
      expect(slide).toHaveAttribute("aria-label");
    });
  });

  test("carousel has correct props", () => {
    render(<CarouselPage />);
    const carousel = screen.getByTestId("carousel");

    // Boolean props are passed as props, not attributes
    expect(carousel).toHaveAttribute("interval", "5000");
    expect(carousel).toHaveAttribute("pause", "hover");

    // Boolean props like fade, indicators, controls are passed as React props
    // but don't appear as HTML attributes in our mock
    // We can verify the carousel component exists and renders correctly
    expect(carousel).toBeInTheDocument();
  });

  test("slide content has correct styling and behavior", () => {
    render(<CarouselPage />);

    const slideContent = screen
      .getByText("Vocabulary")
      .closest('[role="button"]');
    expect(slideContent).toHaveStyle("cursor: pointer");
    expect(slideContent).toHaveStyle("z-index: 100");
  });

  test("images have lazy loading", () => {
    render(<CarouselPage />);

    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  test("images have correct filter and transition styles", () => {
    render(<CarouselPage />);

    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveStyle("filter: brightness(0.6)");
      expect(img).toHaveStyle("transition: filter 0.3s ease");
    });
  });
});
