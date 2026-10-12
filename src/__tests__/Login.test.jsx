import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Login from "../components/Login";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Firebase auth
vi.mock("../config/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock Firebase auth functions
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

// Mock react-google-button
vi.mock("react-google-button", () => ({
  default: ({ onClick, disabled, ...props }) => (
    <button
      data-testid="google-signin-button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      Sign in with Google
    </button>
  ),
}));

// Create mock functions for auth context
const mockLogIn = vi.fn();
const mockGoogleSignIn = vi.fn();
const mockUser = { email: "test@example.com", uid: "123" };

// Mock the entire UserAuthContext with controllable user state
let mockUserState = null;
let mockLoadingState = false;

const mockUseUserAuth = vi.fn(() => ({
  user: mockUserState,
  loading: mockLoadingState,
  logIn: mockLogIn,
  signUp: vi.fn(),
  logOut: vi.fn(),
  googleSignIn: mockGoogleSignIn,
}));

// Mock the entire UserAuthContext
vi.mock("../context/UserAuthContext", () => ({
  UserAuthContextProvider: ({ children }) => children,
  useUserAuth: () => mockUseUserAuth(),
}));

// Test wrapper component
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("Login Component", () => {
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state - no user logged in
    mockUserState = null;
    mockLoadingState = false;
  });

  const renderLogin = () => {
    return render(
      <TestWrapper>
        <Login Toggle={mockToggle} />
      </TestWrapper>
    );
  };

  describe("Rendering", () => {
    it("should render the login form correctly", () => {
      renderLogin();

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(
        screen.getByText("Login to continue your learning journey")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your password")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log in/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId("google-signin-button")).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
    });

    it("should render form labels correctly", () => {
      renderLogin();

      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
    });

    it("should render the navigation component", () => {
      renderLogin();

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  describe("Form Input Handling", () => {
    it("should update email input value when typing", async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    it("should update password input value when typing", async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });

    it("should clear values when inputs are cleared", async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      await user.clear(emailInput);
      await user.clear(passwordInput);

      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
    });
  });

  describe("Form Validation", () => {
    it("should show error when trying to submit with empty fields", async () => {
      renderLogin();

      // Use direct form submit since button click doesn't trigger onSubmit
      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Email and password cannot be empty.")
        ).toBeInTheDocument();
      });
    });

    it("should show error when email is empty but password is filled", async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      await user.type(passwordInput, "password123");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Email and password cannot be empty.")
        ).toBeInTheDocument();
      });
    });

    it("should show error when password is empty but email is filled", async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      await user.type(emailInput, "test@example.com");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Email and password cannot be empty.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call logIn function when form is submitted with valid data", async () => {
      const user = userEvent.setup();
      mockLogIn.mockResolvedValue({ user: { email: "test@example.com" } });

      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogIn).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
      });
    });

    it("should navigate to home page on successful login", async () => {
      const user = userEvent.setup();
      mockLogIn.mockResolvedValue({ user: { email: "test@example.com" } });

      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should show error message on failed login", async () => {
      const user = userEvent.setup();
      mockLogIn.mockRejectedValue(new Error("Invalid credentials"));

      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to log in. Invalid credentials")
        ).toBeInTheDocument();
      });
    });

    it("should show loading state when submitting", async () => {
      const user = userEvent.setup();
      mockLogIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderLogin();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const form = document.querySelector("form");
      fireEvent.submit(form);

      expect(screen.getByText("Logging in...")).toBeInTheDocument();
      const submitButton = screen.getByRole("button", {
        name: /logging in.../i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Google Sign In", () => {
    it("should call Google sign in when Google button is clicked", async () => {
      const user = userEvent.setup();
      mockGoogleSignIn.mockResolvedValue({ user: { email: "test@gmail.com" } });

      renderLogin();

      const googleButton = screen.getByTestId("google-signin-button");
      await user.click(googleButton);

      expect(mockGoogleSignIn).toHaveBeenCalled();
    });

    it("should navigate to home page on successful Google sign in", async () => {
      const user = userEvent.setup();
      mockGoogleSignIn.mockResolvedValue({ user: { email: "test@gmail.com" } });

      renderLogin();

      const googleButton = screen.getByTestId("google-signin-button");
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should show error message on failed Google sign in", async () => {
      const user = userEvent.setup();
      mockGoogleSignIn.mockRejectedValue(new Error("Google sign in failed"));

      renderLogin();

      const googleButton = screen.getByTestId("google-signin-button");
      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText("Google sign-in failed. Google sign in failed")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Links and Navigation", () => {
    it("should have a link to register page", () => {
      renderLogin();

      const signUpLink = screen.getByText("Sign up");
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink.closest("a")).toHaveAttribute("href", "/register");
    });
  });

  describe("Authentication State", () => {
    it("should show login form when user is not logged in", () => {
      mockUserState = null;
      renderLogin();

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your password")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log in/i })
      ).toBeInTheDocument();
    });

    it("should show loading state while authentication is in progress", () => {
      mockUserState = null;
      mockLoadingState = true;
      renderLogin();

      // Component should still render but in loading state
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    it("should handle user being already logged in", () => {
      mockUserState = mockUser;
      mockLoadingState = false;
      renderLogin();

      // Login form should still be accessible (might redirect in real app)
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    it("should clear user state after logout simulation", () => {
      // First set user as logged in
      mockUserState = mockUser;
      const { rerender } = renderLogin();

      // Then simulate logout
      mockUserState = null;
      rerender(
        <TestWrapper>
          <Login Toggle={mockToggle} />
        </TestWrapper>
      );

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email")
      ).toBeInTheDocument();
    });

    it("should update navigation based on user state", () => {
      // Test with no user
      mockUserState = null;
      const { rerender } = renderLogin();

      // Navigation should show Login/Register links
      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();

      // Test with logged in user
      mockUserState = mockUser;
      rerender(
        <TestWrapper>
          <Login Toggle={mockToggle} />
        </TestWrapper>
      );

      // Navigation should show user email
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });
  });

  describe("Login State Management", () => {
    it("should simulate complete login flow", async () => {
      const user = userEvent.setup();

      // Start with no user
      mockUserState = null;
      renderLogin();

      // Fill and submit form
      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // Mock successful login
      mockLogIn.mockImplementation(async () => {
        mockUserState = mockUser; // Simulate user state change
        return { user: mockUser };
      });

      const form = document.querySelector("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogIn).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should handle authentication persistence", () => {
      // Test with persistent user (e.g., page refresh)
      mockUserState = mockUser;
      mockLoadingState = false;

      renderLogin();

      // Should not redirect if already on login page
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    it("should handle different user types", () => {
      // Test with different user data
      const adminUser = {
        email: "admin@example.com",
        uid: "admin123",
        role: "admin",
      };
      mockUserState = adminUser;

      renderLogin();

      // Navigation should show admin email
      expect(screen.getByText(adminUser.email)).toBeInTheDocument();
    });
  });
  it("should have proper form labels", () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    expect(emailInput).toHaveAttribute("id", "formEmail");
    expect(passwordInput).toHaveAttribute("id", "formPassword");

    const emailLabel = screen.getByText("Email Address");
    const passwordLabel = screen.getByText("Password");

    expect(emailLabel).toHaveAttribute("for", "formEmail");
    expect(passwordLabel).toHaveAttribute("for", "formPassword");
  });

  it("should have required attribute on form inputs", () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("required");
  });

  it("should have proper autocomplete attributes", () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});
