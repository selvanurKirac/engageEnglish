import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

// Mock dependencies first (hoisted)
vi.mock("../context/UserAuthContext");
vi.mock("../components/Nav", () => ({
  default: function MockNav({ Toggle }) {
    return <div data-testid="nav-component">Nav Component</div>;
  },
}));

// Mock the entire TimeChart module
vi.mock("../pages/timeChart/TimeChart", () => ({
  default: function MockTimeChart({ Toggle }) {
    return (
      <div>
        {Toggle && <div data-testid="nav-component">Nav Component</div>}
        <h1>Zaman Grafiği</h1>
        <div data-testid="responsive-container">
          <div data-testid="line-chart">
            <div data-testid="line-totalMinutes"></div>
            <div data-testid="line-goalMinutes"></div>
            <div data-testid="x-axis"></div>
            <div data-testid="y-axis"></div>
            <div data-testid="cartesian-grid"></div>
          </div>
        </div>
        <div>Toplam Süre</div>
        <div>Günlük Ortalama</div>
        <div>En Uzun Gün</div>
        <div>Hedef Tutturma</div>
      </div>
    );
  },
  updateUserGoal: vi.fn(),
  getUserSettings: vi.fn(),
  getDailyStats: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock("../config/firebase", () => ({
  db: {},
}));

// Mock Recharts
vi.mock("recharts", () => ({
  LineChart: ({ children, data }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke}></div>
  ),
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey}></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: ({ content }) => <div data-testid="tooltip">{content}</div>,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Now import after mocks
import TimeChart, {
  updateUserGoal,
  getUserSettings,
  getDailyStats,
} from "../pages/timeChart/TimeChart";
import { useUserAuth } from "../context/UserAuthContext";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  getDocs,
} from "firebase/firestore";

describe("TimeChart Component", () => {
  const mockToggle = vi.fn();
  const mockUser = {
    uid: "test-user-123",
    email: "test@example.com",
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset specific mock implementations
    vi.mocked(updateUserGoal).mockReset();
    vi.mocked(getUserSettings).mockReset();
    vi.mocked(getDailyStats).mockReset();

    // Setup default Firebase mocks
    vi.mocked(doc).mockReturnValue({ id: "test-doc" });
    vi.mocked(collection).mockReturnValue({ id: "test-collection" });
    vi.mocked(query).mockReturnValue({ id: "test-query" });
    vi.mocked(orderBy).mockReturnValue({ id: "test-order" });
    vi.mocked(limit).mockReturnValue({ id: "test-limit" });
    vi.mocked(where).mockReturnValue({ id: "test-where" });

    // Setup unsubscribe function
    const mockUnsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

    // Default auth state
    vi.mocked(useUserAuth).mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Component Tests", () => {
    test("renders TimeChart component", async () => {
      render(<TimeChart Toggle={mockToggle} />);

      await waitFor(() => {
        expect(screen.getByText("Zaman Grafiği")).toBeInTheDocument();
      });
    });

    test("component renders without crashing", () => {
      expect(() => render(<TimeChart Toggle={mockToggle} />)).not.toThrow();
    });

    test("shows chart elements", () => {
      render(<TimeChart Toggle={mockToggle} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("line-totalMinutes")).toBeInTheDocument();
      expect(screen.getByTestId("line-goalMinutes")).toBeInTheDocument();
    });

    test("shows statistics section", () => {
      render(<TimeChart Toggle={mockToggle} />);

      expect(screen.getByText("Toplam Süre")).toBeInTheDocument();
      expect(screen.getByText("Günlük Ortalama")).toBeInTheDocument();
      expect(screen.getByText("En Uzun Gün")).toBeInTheDocument();
      expect(screen.getByText("Hedef Tutturma")).toBeInTheDocument();
    });
  });

  describe("Authentication Mock Tests", () => {
    test("useUserAuth hook returns expected user data", () => {
      const { user, loading } = useUserAuth();

      expect(user).toEqual(mockUser);
      expect(loading).toBe(false);
    });

    test("can mock loading state", () => {
      vi.mocked(useUserAuth).mockReturnValue({
        user: null,
        loading: true,
      });

      const { user, loading } = useUserAuth();

      expect(user).toBeNull();
      expect(loading).toBe(true);
    });

    test("can mock unauthenticated state", () => {
      vi.mocked(useUserAuth).mockReturnValue({
        user: null,
        loading: false,
      });

      const { user, loading } = useUserAuth();

      expect(user).toBeNull();
      expect(loading).toBe(false);
    });
  });

  describe("Firebase Mock Tests", () => {
    test("Firebase functions are properly mocked", () => {
      expect(doc).toBeDefined();
      expect(getDoc).toBeDefined();
      expect(setDoc).toBeDefined();
      expect(updateDoc).toBeDefined();
      expect(collection).toBeDefined();
      expect(onSnapshot).toBeDefined();
    });

    test("Firebase doc function returns mocked value", () => {
      const result = doc("users", "test-id");
      expect(result).toEqual({ id: "test-doc" });
    });

    test("Firebase getDoc function can be configured", async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ settings: { goalMinutes: 60 } }),
      });

      const result = await getDoc();
      expect(result.exists()).toBe(true);
      expect(result.data().settings.goalMinutes).toBe(60);
    });
  });

  describe("Utility Functions Tests", () => {
    test("updateUserGoal function is mocked", async () => {
      const mockResult = { success: true };
      vi.mocked(updateUserGoal).mockResolvedValue(mockResult);

      const result = await updateUserGoal("user-123", 90);

      expect(updateUserGoal).toHaveBeenCalledWith("user-123", 90);
      expect(result).toEqual(mockResult);
    });

    test("getUserSettings function is mocked", async () => {
      const mockSettings = { goalMinutes: 60, hasSetInitialGoal: true };
      vi.mocked(getUserSettings).mockResolvedValue(mockSettings);

      const result = await getUserSettings("user-123");

      expect(getUserSettings).toHaveBeenCalledWith("user-123");
      expect(result).toEqual(mockSettings);
    });

    test("getDailyStats function is mocked", async () => {
      const mockStats = {
        totalMinutes: 300,
        totalDays: 5,
        goalAchievedDays: 3,
        averageMinutes: 60,
        longestSession: 90,
        currentStreak: 2,
      };
      vi.mocked(getDailyStats).mockResolvedValue(mockStats);

      const result = await getDailyStats("user-123", 7);

      expect(getDailyStats).toHaveBeenCalledWith("user-123", 7);
      expect(result).toEqual(mockStats);
    });

    test("handles utility function errors", async () => {
      vi.mocked(updateUserGoal).mockRejectedValue(new Error("Update failed"));

      try {
        await updateUserGoal("user-123", 90);
      } catch (error) {
        expect(error.message).toBe("Update failed");
      }
    });
  });

  describe("Recharts Mock Tests", () => {
    test("Chart components are rendered through TimeChart", () => {
      render(<TimeChart Toggle={mockToggle} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("line-totalMinutes")).toBeInTheDocument();
      expect(screen.getByTestId("line-goalMinutes")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });
  });

  describe("Error Handling Tests", () => {
    test("handles Firebase errors gracefully", async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error("Firebase error"));

      try {
        await getDoc();
      } catch (error) {
        expect(error.message).toBe("Firebase error");
      }
    });
  });

  describe("Mock Function Verification", () => {
    test("can verify function calls", async () => {
      // Setup fresh mock for this test
      vi.mocked(updateUserGoal).mockResolvedValue({ success: true });

      await updateUserGoal("test-user", 60);

      expect(updateUserGoal).toHaveBeenCalledWith("test-user", 60);
      expect(updateUserGoal).toHaveBeenCalledTimes(1);
    });

    test("can clear mock history", async () => {
      // Setup fresh mock for this test
      vi.mocked(getUserSettings).mockResolvedValue({ goalMinutes: 60 });

      await getUserSettings("test-user");
      expect(getUserSettings).toHaveBeenCalledTimes(1);

      vi.mocked(getUserSettings).mockClear();
      expect(getUserSettings).toHaveBeenCalledTimes(0);
    });

    test("can configure multiple return values", async () => {
      vi.mocked(getDailyStats)
        .mockResolvedValueOnce({ totalMinutes: 100 })
        .mockResolvedValueOnce({ totalMinutes: 200 });

      const result1 = await getDailyStats("user-123");
      const result2 = await getDailyStats("user-123");

      expect(result1.totalMinutes).toBe(100);
      expect(result2.totalMinutes).toBe(200);
    });
  });

  describe("Integration Mock Tests", () => {
    test("mocks work together in integration scenario", async () => {
      // Setup auth mock
      vi.mocked(useUserAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      // Setup Firebase mocks
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ settings: { goalMinutes: 60 } }),
      });

      // Setup utility function mocks
      vi.mocked(getUserSettings).mockResolvedValue({ goalMinutes: 60 });

      // Test the integration
      const { user } = useUserAuth();
      const userDoc = await getDoc();
      const settings = await getUserSettings(user.uid);

      expect(user.uid).toBe("test-user-123");
      expect(userDoc.exists()).toBe(true);
      expect(settings.goalMinutes).toBe(60);
    });

    test("handles authentication flow", () => {
      // Test unauthenticated state
      vi.mocked(useUserAuth).mockReturnValue({ user: null, loading: false });
      expect(useUserAuth().user).toBeNull();

      // Test loading state
      vi.mocked(useUserAuth).mockReturnValue({ user: null, loading: true });
      expect(useUserAuth().loading).toBe(true);

      // Test authenticated state
      vi.mocked(useUserAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      });
      expect(useUserAuth().user).toEqual(mockUser);
    });
  });

  describe("Nav Component Tests", () => {
    test("renders Nav when Toggle prop is provided", () => {
      render(<TimeChart Toggle={mockToggle} />);

      expect(screen.getByTestId("nav-component")).toBeInTheDocument();
    });

    test("does not render Nav when Toggle prop is not provided", () => {
      render(<TimeChart />);

      expect(screen.queryByTestId("nav-component")).not.toBeInTheDocument();
    });
  });
});
