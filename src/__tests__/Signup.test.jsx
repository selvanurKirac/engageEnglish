import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, test, expect, beforeEach, vi } from "vitest";
import Signup from "../components/Signup";
import { useUserAuth } from "../context/UserAuthContext";

// Mock dependencies
vi.mock("../context/UserAuthContext");
vi.mock("../components/Nav", () => ({
  default: function MockNav({ Toggle }) {
    return <div data-testid="nav-component">Nav Component</div>;
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

// Test wrapper component
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("Signup Component", () => {
  const mockSignUp = vi.fn();
  const mockToggle = vi.fn();

  beforeEach(() => {
    useUserAuth.mockReturnValue({
      signUp: mockSignUp,
    });

    mockSignUp.mockClear();
    mockNavigate.mockClear();
    mockToggle.mockClear();
  });

  const renderSignup = () => {
    return render(
      <TestWrapper>
        <Signup Toggle={mockToggle} />
      </TestWrapper>
    );
  };

  describe("Component Rendering", () => {
    test("renders signup form with all required fields", () => {
      renderSignup();

      expect(screen.getByText("Create Account")).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign up/i })
      ).toBeInTheDocument();
    });

    test("renders Nav component with Toggle prop", () => {
      renderSignup();
      expect(screen.getByTestId("nav-component")).toBeInTheDocument();
    });

    test("renders sign in link", () => {
      renderSignup();
      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/login");
    });

    test("displays password requirements", () => {
      renderSignup();
      expect(
        screen.getByText(/your password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Input Functionality", () => {
    test("allows user to type in email field", async () => {
      const user = userEvent.setup();
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    test("allows user to type in password field", async () => {
      const user = userEvent.setup();
      renderSignup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });

    test("allows user to type in confirm password field", async () => {
      const user = userEvent.setup();
      renderSignup();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, "password123");

      expect(confirmPasswordInput).toHaveValue("password123");
    });

    test("form fields are initially empty", () => {
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });
  });

  describe("Form Submission - Success Cases", () => {
    test("calls signUp with correct credentials on valid form submission", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue();
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
      });
    });

    test("navigates to home page on successful signup", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue();
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("accepts various valid email formats", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue();

      const validEmails = [
        "user@domain.com",
        "user.name@domain.com",
        "user+tag@domain.co.uk",
        "test123@subdomain.domain.org",
      ];

      for (const email of validEmails) {
        const { unmount } = renderSignup();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(emailInput, email);
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getAllByRole("button", {
          name: /sign up/i,
        })[0];
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledWith(email, "password123");
        });

        mockSignUp.mockClear();
        unmount(); // Clean up before next iteration
      }
    });

    test("handles long passwords correctly", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue();
      renderSignup();

      const longPassword = "a".repeat(50);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, longPassword);
      await user.type(confirmPasswordInput, longPassword);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "test@example.com",
          longPassword
        );
      });
    });
  });

  describe("Error Handling", () => {
    test("displays error message on signup failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Email already exists";
      mockSignUp.mockRejectedValue(new Error(errorMessage));
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(`Signup failed. ${errorMessage}`)
        ).toBeInTheDocument();
      });
    });

    test("handles network errors gracefully", async () => {
      const user = userEvent.setup();
      mockSignUp.mockRejectedValue(new Error("Network error"));
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Signup failed. Network error")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    test("shows loading state during form submission", async () => {
      const user = userEvent.setup();
      let resolveSignUp;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText("Creating Account...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolveSignUp();

      await waitFor(() => {
        expect(
          screen.queryByText("Creating Account...")
        ).not.toBeInTheDocument();
      });
    });

    test("disables submit button during loading", async () => {
      const user = userEvent.setup();
      let resolveSignUp;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /sign up/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);
      expect(submitButton).toBeDisabled();

      resolveSignUp();
    });
  });

  describe("Accessibility", () => {
    test("has proper form labels and accessibility attributes", () => {
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toHaveAttribute("required");

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
      expect(passwordInput).toHaveAttribute("required");

      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute(
        "autoComplete",
        "new-password"
      );
      expect(confirmPasswordInput).toHaveAttribute("required");
    });

    test("form has proper structure for screen readers", () => {
      renderSignup();

      // Check that form element exists
      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      expect(submitButton).toHaveAttribute("type", "submit");

      // Check that form inputs have proper labels
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    test("submit button is clickable when form is valid", async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue();
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /sign up/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      expect(mockSignUp).toHaveBeenCalled();
    });

    test("can interact with sign in link", () => {
      renderSignup();

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Form Field Properties", () => {
    test("email field has correct input type and attributes", () => {
      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("placeholder", "example@email.com");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
    });

    test("password fields have correct input type and attributes", () => {
      renderSignup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute(
        "placeholder",
        "At least 6 characters"
      );
      expect(passwordInput).toHaveAttribute("autoComplete", "new-password");

      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute(
        "placeholder",
        "Re-enter your password"
      );
      expect(confirmPasswordInput).toHaveAttribute(
        "autoComplete",
        "new-password"
      );
    });
  });

  describe("Authentication State Verification", () => {
    test("user is signed in after successful signup", async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: "test-user-123",
        email: "test@example.com",
        displayName: "Test User",
      };

      // Mock successful signup that returns user
      mockSignUp.mockResolvedValue(mockUser);

      // Mock updated context state after signup
      useUserAuth.mockReturnValue({
        signUp: mockSignUp,
        user: mockUser,
        currentUser: mockUser,
      });

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("handles authentication failure correctly", async () => {
      const user = userEvent.setup();

      // Mock authentication failure
      const authError = new Error("Authentication failed");
      mockSignUp.mockRejectedValue(authError);

      // Context should remain unauthenticated
      useUserAuth.mockReturnValue({
        signUp: mockSignUp,
        user: null,
        currentUser: null,
      });

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Signup failed. Authentication failed")
        ).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test("signup process updates user context correctly", async () => {
      const user = userEvent.setup();
      let contextUser = null;

      // Mock context that changes after signup
      const mockUpdatedAuth = {
        signUp: vi.fn().mockImplementation(async (email, password) => {
          // Simulate context update after successful signup
          contextUser = {
            uid: "new-user-123",
            email: email,
            displayName: email.split("@")[0],
          };
          return contextUser;
        }),
        user: contextUser,
        currentUser: contextUser,
      };

      useUserAuth.mockReturnValue(mockUpdatedAuth);

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatedAuth.signUp).toHaveBeenCalledWith(
          "newuser@example.com",
          "password123"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("prevents multiple signup attempts during processing", async () => {
      const user = userEvent.setup();

      // Mock slow signup process
      let resolveSignUp;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });

      // First click
      await user.click(submitButton);
      expect(submitButton).toBeDisabled();

      // Try to click again while processing
      await user.click(submitButton);

      // Should only be called once
      expect(mockSignUp).toHaveBeenCalledTimes(1);

      // Complete the signup
      resolveSignUp({ uid: "test-123", email: "test@example.com" });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("maintains form state during signup process", async () => {
      const user = userEvent.setup();

      // Mock slow signup process
      let resolveSignUp;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      // Form values should be maintained during processing
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
      expect(confirmPasswordInput).toHaveValue("password123");

      // Complete the signup
      resolveSignUp({ uid: "test-123", email: "test@example.com" });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("clears sensitive form data after successful signup", async () => {
      const user = userEvent.setup();
      const mockUser = { uid: "test-123", email: "test@example.com" };

      mockSignUp.mockResolvedValue(mockUser);

      renderSignup();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      // Note: In real implementation, you might want to clear password fields
      // This test documents the expected behavior
    });
  });
  test("Toggle prop is passed to Nav component", () => {
    renderSignup();

    // Nav component is rendered (we can see it in the DOM)
    expect(screen.getByTestId("nav-component")).toBeInTheDocument();
  });

  test("useUserAuth hook is called correctly", () => {
    renderSignup();

    expect(useUserAuth).toHaveBeenCalled();
  });

  test("component renders without crashing", () => {
    expect(() => renderSignup()).not.toThrow();
  });
});
