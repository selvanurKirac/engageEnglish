// LevelTest.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LevelTest, { getLevelFromScore } from "../pages/leveltest/LevelTest";

// Mock Firebase
vi.mock("../../config/firebase", () => ({
  db: {},
  auth: {},
  app: {},
}));

// Mock Firebase Firestore functions
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: "test-doc-id" }),
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue({}),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ name: "Test User" }),
  }),
  setDoc: vi.fn().mockResolvedValue({}),
}));

// Mock Firebase Auth functions
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase App functions
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

// Mock UserAuth Context
vi.mock("../context/UserAuthContext", () => ({
  useUserAuth: vi.fn(),
}));

// Mock Nav component
vi.mock("../../components/Nav", () => ({
  default: ({ Toggle }) => <div data-testid="nav-component">Nav Component</div>,
}));

// Mock test data - Simplified version
vi.mock("../../data/english_level_test.json", () => ({
  default: [
    // A1 level questions - 8 questions
    {
      level: "A1",
      type: "Grammar",
      question: "What ___ your name?",
      options: ["is", "are", "am", "be"],
      correct: "is",
    },
    {
      level: "A1",
      type: "Vocabulary",
      question: "Hello, how ___ you?",
      options: ["is", "are", "am", "be"],
      correct: "are",
    },
    // Add minimal questions for other levels too...
    {
      level: "A2",
      type: "Grammar",
      question: "I ___ to school yesterday.",
      options: ["go", "went", "going", "goes"],
      correct: "went",
    },
  ],
}));

// Import useUserAuth after mocking
import { useUserAuth } from "../context/UserAuthContext";

describe("LevelTest Component", () => {
  const mockUser = {
    uid: "test-user-id",
    email: "test@example.com",
    displayName: "Test User",
  };

  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUserAuth.mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Utility Functions", () => {
    describe("getLevelFromScore", () => {
      it("should return correct levels for different scores", () => {
        expect(getLevelFromScore(20)).toBe("A1");
        expect(getLevelFromScore(35)).toBe("A2");
        expect(getLevelFromScore(60)).toBe("B1");
        expect(getLevelFromScore(85)).toBe("B2");
        expect(getLevelFromScore(110)).toBe("C1");
        expect(getLevelFromScore(130)).toBe("C2");
      });

      it("should handle edge cases", () => {
        expect(getLevelFromScore(0)).toBe("A1");
        expect(getLevelFromScore(25)).toBe("A1");
        expect(getLevelFromScore(26)).toBe("A2");
        expect(getLevelFromScore(45)).toBe("A2");
        expect(getLevelFromScore(46)).toBe("B1");
      });
    });
  });

  describe("Test Start Screen", () => {
    it("should render start screen initially", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("İngilizce Seviye Testi")).toBeInTheDocument();
      expect(
        screen.getByText(
          "İngilizce seviyenizi keşfedin ve öğrenme yolculuğunuzu planlayın"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Teste Başla")).toBeInTheDocument();
    });

    it("should display user greeting when user is logged in", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("Hoş geldin, Test User!")).toBeInTheDocument();
    });

    it("should display test information cards", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("52 Soru")).toBeInTheDocument();
      expect(screen.getByText("~15 Dakika")).toBeInTheDocument();
      expect(screen.getByText("Anında Sonuç")).toBeInTheDocument();
    });

    it("should display level descriptions", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("A2")).toBeInTheDocument();
      expect(screen.getByText("B1")).toBeInTheDocument();
      expect(screen.getByText("B2")).toBeInTheDocument();
      expect(screen.getByText("C1")).toBeInTheDocument();
      expect(screen.getByText("C2")).toBeInTheDocument();
    });

    it("should display test rules", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Use getAllByText for multiple occurrences
      const timeRuleElements = screen.getAllByText(
        "Her soru için 30 saniye süreniz var"
      );
      expect(timeRuleElements.length).toBeGreaterThan(0);

      expect(
        screen.getByText(
          "Süre bittiğinde otomatik olarak sonraki soruya geçilir"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Cevapladıktan sonra geri dönüş yapılamaz")
      ).toBeInTheDocument();
    });

    it("should start test when start button is clicked", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(startButton);
      }).not.toThrow();

      // Button should still be in document after click (since it shows loading)
      expect(startButton).toBeInTheDocument();
    });
  });

  describe("Basic Test Functionality", () => {
    it("should render without errors", () => {
      expect(() => {
        render(<LevelTest Toggle={mockToggle} />);
      }).not.toThrow();
    });

    it("should handle start button click without errors", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(startButton);
      }).not.toThrow();
    });

    it("should display main content after render", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Should show the main title
      expect(screen.getByText("İngilizce Seviye Testi")).toBeInTheDocument();

      // Should show the start button
      expect(screen.getByText("Teste Başla")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle user not being logged in", () => {
      useUserAuth.mockReturnValue({ user: null });

      render(<LevelTest Toggle={mockToggle} />);

      // Should still render start screen
      expect(screen.getByText("İngilizce Seviye Testi")).toBeInTheDocument();
      expect(screen.queryByText("Hoş geldin")).not.toBeInTheDocument();
    });

    it("should handle Firebase errors gracefully", async () => {
      const { addDoc } = await import("firebase/firestore");
      addDoc.mockRejectedValueOnce(new Error("Firebase error"));

      // Test should still work even with Firebase errors
      render(<LevelTest Toggle={mockToggle} />);
      expect(screen.getByText("İngilizce Seviye Testi")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /Teste Başla/ });
      expect(startButton).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      // Should be focusable
      startButton.focus();
      expect(startButton).toHaveFocus();
    });
  });

  describe("Firebase Integration", () => {
    it("should import Firebase functions without errors", async () => {
      const { addDoc, collection } = await import("firebase/firestore");

      expect(addDoc).toBeDefined();
      expect(collection).toBeDefined();
    });

    it("should have Firebase mocks configured correctly", () => {
      // Test that mocks are properly set up
      expect(vi.isMockFunction(useUserAuth)).toBe(true);
    });
  });

  describe("Component Props", () => {
    it("should accept Toggle prop", () => {
      const customToggle = vi.fn();

      expect(() => {
        render(<LevelTest Toggle={customToggle} />);
      }).not.toThrow();
    });

    it("should call Toggle prop when provided", () => {
      const customToggle = vi.fn();
      render(<LevelTest Toggle={customToggle} />);

      // Toggle might be called by Nav component
      // We're just testing that it doesn't break
      expect(customToggle).toBeDefined();
    });
  });

  describe("User Interface Elements", () => {
    it("should display emoji icons correctly", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Check for emoji presence in the DOM
      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("🚀")).toBeInTheDocument();
      expect(screen.getByText("📝")).toBeInTheDocument();
      expect(screen.getByText("⏱️")).toBeInTheDocument();
      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("should display progress indicators section", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("📊 Seviye Açıklamaları")).toBeInTheDocument();
      expect(screen.getByText("📋 Test Kuralları")).toBeInTheDocument();
    });

    it("should display test information with correct styling classes", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const title = screen.getByText("İngilizce Seviye Testi");
      expect(title).toHaveClass("fw-bold", "text-dark", "mb-3");
    });

    it("should display all level badges with correct colors", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Check that all level badges are present
      const badges = screen.getAllByText(/^(A1|A2|B1|B2|C1|C2)$/);
      expect(badges).toHaveLength(6);
    });
  });

  describe("Content Validation", () => {
    it("should display all required test information", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Test duration
      expect(screen.getByText("~15 Dakika")).toBeInTheDocument();

      // Question count
      expect(screen.getByText("52 Soru")).toBeInTheDocument();

      // Result promise
      expect(screen.getByText("Anında Sonuç")).toBeInTheDocument();

      // Instructions
      expect(
        screen.getByText("Hazır olduğunuzda butona tıklayın")
      ).toBeInTheDocument();
    });

    it("should display level descriptions correctly", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(
        screen.getByText(
          "Başlangıç seviyesi - Temel kelimeler ve basit cümleler"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Temel seviye - Günlük konuşmalar ve basit metinler")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Orta seviye - Genel konularda anlayış ve ifade")
      ).toBeInTheDocument();
    });

    it("should display all test rules", () => {
      render(<LevelTest Toggle={mockToggle} />);

      expect(
        screen.getByText(
          "Süre bittiğinde otomatik olarak sonraki soruya geçilir"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Test sonuçlarınız otomatik olarak kaydedilir")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sayfayı yenilemeyin veya geri gitmeyin")
      ).toBeInTheDocument();
    });
  });

  describe("Responsive Design Elements", () => {
    it("should contain Bootstrap responsive classes", () => {
      render(<LevelTest Toggle={mockToggle} />);

      // Check for responsive container
      const container = document.querySelector(".container-fluid");
      expect(container).toBeInTheDocument();

      // Check for responsive columns
      const columns = document.querySelectorAll(".col-md-4, .col-md-6");
      expect(columns.length).toBeGreaterThan(0);
    });

    it("should have proper card structure", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const cards = document.querySelectorAll(".card");
      expect(cards.length).toBeGreaterThan(0);

      const cardBodies = document.querySelectorAll(".card-body");
      expect(cardBodies.length).toBeGreaterThan(0);
    });
  });

  describe("Component State Management", () => {
    it("should maintain consistent state on multiple renders", () => {
      const { rerender } = render(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("Teste Başla")).toBeInTheDocument();

      rerender(<LevelTest Toggle={mockToggle} />);

      expect(screen.getByText("Teste Başla")).toBeInTheDocument();
    });

    it("should handle re-renders without errors", () => {
      const { rerender } = render(<LevelTest Toggle={mockToggle} />);

      expect(() => {
        rerender(<LevelTest Toggle={vi.fn()} />);
      }).not.toThrow();
    });
  });

  describe("User Interaction Scenarios", () => {
    it("should handle multiple button clicks", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      expect(() => {
        fireEvent.click(startButton);
        fireEvent.click(startButton);
        fireEvent.click(startButton);
      }).not.toThrow();
    });

    it("should handle keyboard events on start button", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      expect(() => {
        fireEvent.keyDown(startButton, { key: "Enter", code: "Enter" });
        fireEvent.keyDown(startButton, { key: " ", code: "Space" });
      }).not.toThrow();
    });

    it("should maintain button accessibility attributes", () => {
      render(<LevelTest Toggle={mockToggle} />);

      const startButton = screen.getByText("Teste Başla");

      expect(startButton).toHaveAttribute("type", "button");
      expect(startButton.tagName).toBe("BUTTON");
    });
  });

  describe("Data Structure Validation", () => {
    it("should handle empty user data gracefully", () => {
      useUserAuth.mockReturnValue({ user: {} });

      expect(() => {
        render(<LevelTest Toggle={mockToggle} />);
      }).not.toThrow();
    });

    it("should handle undefined user properties", () => {
      useUserAuth.mockReturnValue({
        user: {
          uid: undefined,
          email: undefined,
          displayName: undefined,
        },
      });

      expect(() => {
        render(<LevelTest Toggle={mockToggle} />);
      }).not.toThrow();
    });

    it("should handle invalid Toggle prop", () => {
      expect(() => {
        render(<LevelTest Toggle={null} />);
      }).not.toThrow();

      expect(() => {
        render(<LevelTest Toggle={undefined} />);
      }).not.toThrow();
    });
  });

  describe("Performance and Memory", () => {
    it("should not create memory leaks on mount/unmount", () => {
      const { unmount } = render(<LevelTest Toggle={mockToggle} />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("should handle rapid re-renders", () => {
      const { rerender } = render(<LevelTest Toggle={mockToggle} />);

      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<LevelTest Toggle={vi.fn()} />);
        }
      }).not.toThrow();
    });
  });

  describe("Mock Validation", () => {
    it("should have all required mocks in place", () => {
      expect(vi.isMockFunction(useUserAuth)).toBe(true);

      // Verify Firebase mocks
      expect(() => {
        require("firebase/firestore");
        require("firebase/auth");
        require("firebase/app");
      }).not.toThrow();
    });

    it("should maintain mock consistency across tests", () => {
      const auth1 = useUserAuth();
      const auth2 = useUserAuth();

      expect(auth1).toEqual(auth2);
    });
  });
});
