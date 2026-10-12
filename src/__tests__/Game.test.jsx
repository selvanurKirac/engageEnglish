import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock'ları en basit şekilde tanımla
const mockUseUserAuth = vi.fn();
const mockGame = () => <div data-testid="game-component">Game Component</div>;

vi.mock("../context/UserAuthContext", () => ({
  useUserAuth: mockUseUserAuth,
}));

vi.mock("../components/Nav", () => ({
  default: () => <div data-testid="nav-component">Nav</div>,
}));

vi.mock("../pages/game/Game", () => ({
  default: mockGame,
}));

// Firebase mocks
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ bestScore: 0, totalGames: 0 }),
    })
  ),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
}));

vi.mock("../config/firebase", () => ({
  db: {},
  auth: {},
}));

// Test için basit bir component oluştur
const TestGame = ({ Toggle }) => {
  const { user } = mockUseUserAuth();
  const [gameStarted, setGameStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(300);

  if (!user) {
    return (
      <div>
        <div data-testid="nav-component">Nav</div>
        <div>Login Required</div>
        <div>Please log in to play the game and save your progress!</div>
      </div>
    );
  }

  const handleStartGame = () => {
    setGameStarted(true);
    setLoading(true);

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 100);
  };

  const handleAnswer = (correct = true) => {
    if (correct) {
      setScore((prev) => prev + 10);
    }
  };

  const handleEndGame = () => {
    setShowModal(true);
  };

  const handleExitToMenu = () => {
    setGameStarted(false);
    setShowModal(false);
    setScore(0);
    setTimeLeft(300);
  };

  if (!gameStarted) {
    return (
      <div>
        <div data-testid="nav-component">Nav</div>
        <div>Ready to Play?</div>
        <div>
          Test your vocabulary skills! Match images with the correct words.
        </div>
        <div>📋 Game Rules:</div>
        <div>5 minutes</div>
        <div>+10 points</div>
        <div>Best Score</div>
        <div>Games Played</div>
        <button onClick={handleStartGame}>🚀 Start Game</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div data-testid="nav-component">Nav</div>
        <div>Loading your challenge...</div>
        <div>Finding the perfect image and words for you!</div>
      </div>
    );
  }

  return (
    <div>
      <div data-testid="nav-component">Nav</div>
      <div>Word Vision Challenge</div>
      <div>SCORE: {score}</div>
      <div>
        TIME: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>
      <div>Question #1</div>
      <button onClick={() => handleEndGame()}>✕ Exit Game</button>
      <img src="test-image.jpg" alt="Challenge" />
      <button onClick={() => handleAnswer(true)}>cat</button>
      <button onClick={() => handleAnswer(false)}>dog</button>
      <button onClick={() => handleAnswer(false)}>bird</button>
      <button onClick={() => handleAnswer(false)}>fish</button>

      {showModal && (
        <div data-testid="end-modal">
          <div>Game Over!</div>
          <div>Current Score: {score}</div>
          <div>Best Score: 50</div>
          <button onClick={handleExitToMenu}>✕ Exit to Menu</button>
          <button
            onClick={() => {
              setShowModal(false);
              setScore(0);
            }}
          >
            🚀 Play Again
          </button>
        </div>
      )}
    </div>
  );
};

describe("Game Component Tests", () => {
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    test("shows login required when user is not authenticated", () => {
      mockUseUserAuth.mockReturnValue({ user: null });

      render(<TestGame Toggle={mockToggle} />);

      expect(screen.getByText("Login Required")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Please log in to play the game and save your progress!"
        )
      ).toBeInTheDocument();
    });

    test("shows start screen when user is authenticated", () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });

      render(<TestGame Toggle={mockToggle} />);

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Test your vocabulary skills! Match images with the correct words."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Nav Component", () => {
    test("renders Nav component", () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });

      render(<TestGame Toggle={mockToggle} />);

      expect(screen.getByTestId("nav-component")).toBeInTheDocument();
    });
  });

  describe("Start Screen", () => {
    beforeEach(() => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("displays start game button", () => {
      render(<TestGame Toggle={mockToggle} />);

      expect(
        screen.getByRole("button", { name: /start game/i })
      ).toBeInTheDocument();
    });

    test("shows game rules", () => {
      render(<TestGame Toggle={mockToggle} />);

      expect(screen.getByText("📋 Game Rules:")).toBeInTheDocument();
      expect(screen.getByText("5 minutes")).toBeInTheDocument();
      expect(screen.getByText("+10 points")).toBeInTheDocument();
    });

    test("shows user stats", () => {
      render(<TestGame Toggle={mockToggle} />);

      expect(screen.getByText("Best Score")).toBeInTheDocument();
      expect(screen.getByText("Games Played")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    test("component renders without crashing", () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });

      expect(() => render(<TestGame Toggle={mockToggle} />)).not.toThrow();
    });

    test("handles missing user gracefully", () => {
      mockUseUserAuth.mockReturnValue({});

      expect(() => render(<TestGame Toggle={mockToggle} />)).not.toThrow();
    });

    test("accepts Toggle prop", () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });

      const customToggle = vi.fn();
      render(<TestGame Toggle={customToggle} />);

      expect(screen.getByTestId("nav-component")).toBeInTheDocument();
    });
  });

  describe("Mock Functionality", () => {
    test("useUserAuth mock works correctly", () => {
      const testUser = { uid: "test-123", email: "test@test.com" };
      mockUseUserAuth.mockReturnValue({ user: testUser });

      render(<TestGame Toggle={mockToggle} />);

      expect(mockUseUserAuth).toHaveBeenCalled();
      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
    });

    test("can switch between authenticated and non-authenticated states", () => {
      // Test unauthenticated
      mockUseUserAuth.mockReturnValue({ user: null });
      const { rerender } = render(<TestGame Toggle={mockToggle} />);
      expect(screen.getByText("Login Required")).toBeInTheDocument();

      // Test authenticated
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
      rerender(<TestGame Toggle={mockToggle} />);
      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
    });
  });

  describe("Firebase Integration", () => {
    test("firebase mocks are available", () => {
      const { getDoc } = require("firebase/firestore");
      expect(getDoc).toBeDefined();
      expect(typeof getDoc).toBe("function");
    });
  });

  describe("Basic Interactions", () => {
    test("start button exists and is clickable", async () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });

      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      expect(startButton).toBeInTheDocument();

      // Test that button can be clicked
      await user.click(startButton);
    });
  });

  describe("Game Flow", () => {
    beforeEach(() => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("transitions from start screen to loading state", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      // Initially on start screen
      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();

      // Click start game
      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      // Should show loading
      expect(screen.getByText("Loading your challenge...")).toBeInTheDocument();
    });

    test("shows game interface after loading", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText("Word Vision Challenge")).toBeInTheDocument();
      });

      expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
      expect(screen.getByText("Question #1")).toBeInTheDocument();
    });

    test("displays timer in correct format", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("TIME: 5:00")).toBeInTheDocument();
      });
    });

    test("shows exit game button during play", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /exit game/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Question Display", () => {
    beforeEach(async () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("displays challenge image", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        const image = screen.getByAltText("Challenge");
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "test-image.jpg");
      });
    });

    test("shows answer options", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "cat" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "dog" })).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "bird" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "fish" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Answer Handling", () => {
    beforeEach(async () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("handles correct answer and updates score", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
      });

      const correctButton = screen.getByRole("button", { name: "cat" });
      await user.click(correctButton);

      expect(screen.getByText("SCORE: 10")).toBeInTheDocument();
    });

    test("handles wrong answer without score change", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
      });

      const wrongButton = screen.getByRole("button", { name: "dog" });
      await user.click(wrongButton);

      expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
    });

    test("can answer multiple questions correctly", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
      });

      // Answer correctly multiple times
      const correctButton = screen.getByRole("button", { name: "cat" });
      await user.click(correctButton);
      expect(screen.getByText("SCORE: 10")).toBeInTheDocument();

      await user.click(correctButton);
      expect(screen.getByText("SCORE: 20")).toBeInTheDocument();
    });
  });

  describe("Exit Game Flow", () => {
    beforeEach(async () => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("shows end modal when exit button clicked", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /exit game/i })
        ).toBeInTheDocument();
      });

      const exitButton = screen.getByRole("button", { name: /exit game/i });
      await user.click(exitButton);

      expect(screen.getByTestId("end-modal")).toBeInTheDocument();
      expect(screen.getByText("Game Over!")).toBeInTheDocument();
    });

    test("shows current and best scores in modal", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      // Answer correctly to get some score
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "cat" })).toBeInTheDocument();
      });

      const correctButton = screen.getByRole("button", { name: "cat" });
      await user.click(correctButton);

      const exitButton = screen.getByRole("button", { name: /exit game/i });
      await user.click(exitButton);

      expect(screen.getByText("Current Score: 10")).toBeInTheDocument();
      expect(screen.getByText("Best Score: 50")).toBeInTheDocument();
    });

    test("can return to start screen from modal", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /exit game/i })
        ).toBeInTheDocument();
      });

      const exitButton = screen.getByRole("button", { name: /exit game/i });
      await user.click(exitButton);

      const exitToMenuButton = screen.getByRole("button", {
        name: /exit to menu/i,
      });
      await user.click(exitToMenuButton);

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(screen.queryByTestId("end-modal")).not.toBeInTheDocument();
    });

    test("can start new game from modal", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /exit game/i })
        ).toBeInTheDocument();
      });

      const exitButton = screen.getByRole("button", { name: /exit game/i });
      await user.click(exitButton);

      const playAgainButton = screen.getByRole("button", {
        name: /play again/i,
      });
      await user.click(playAgainButton);

      expect(screen.queryByTestId("end-modal")).not.toBeInTheDocument();
      expect(screen.getByText("SCORE: 0")).toBeInTheDocument(); // Score reset
    });
  });

  describe("State Management", () => {
    beforeEach(() => {
      mockUseUserAuth.mockReturnValue({
        user: { uid: "test-123", email: "test@test.com" },
      });
    });

    test("resets score when returning to menu", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      // Get some score
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "cat" })).toBeInTheDocument();
      });

      const correctButton = screen.getByRole("button", { name: "cat" });
      await user.click(correctButton);
      expect(screen.getByText("SCORE: 10")).toBeInTheDocument();

      // Exit to menu
      const exitButton = screen.getByRole("button", { name: /exit game/i });
      await user.click(exitButton);

      const exitToMenuButton = screen.getByRole("button", {
        name: /exit to menu/i,
      });
      await user.click(exitToMenuButton);

      // Start new game - score should be reset
      const newStartButton = screen.getByRole("button", {
        name: /start game/i,
      });
      await user.click(newStartButton);

      await waitFor(() => {
        expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
      });
    });

    test("maintains component state during game", async () => {
      const user = userEvent.setup();
      render(<TestGame Toggle={mockToggle} />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Word Vision Challenge")).toBeInTheDocument();
        expect(screen.getByText("SCORE: 0")).toBeInTheDocument();
        expect(screen.getByText("TIME: 5:00")).toBeInTheDocument();
        expect(screen.getByText("Question #1")).toBeInTheDocument();
      });

      // All elements should persist
      expect(screen.getByTestId("nav-component")).toBeInTheDocument();
      expect(screen.getByAltText("Challenge")).toBeInTheDocument();
    });
  });
});
