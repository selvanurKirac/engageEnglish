// __tests__/BusinessEnglish.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BusinessEnglish from "../../src/pages/businessenglish/BusinessEnglish";
import BusinessVideos from "../../src/pages/businessenglish/BusinessVideos";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../src/data/businessEnglish.json", () => ({
  default: [
    {
      word: "revenue",
      category: "finance",
      definition: "income generated from normal business operations",
      example: "The company’s revenue increased this year.",
    },
    {
      word: "merger",
      category: "corporate",
      definition: "a combination of two companies",
      example: "The merger was approved by shareholders.",
    },
  ],
}));

describe("BusinessEnglish Component", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Business English Vocabulary/i)
    ).toBeInTheDocument();
  });

  it("renders all cards initially", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    expect(screen.getByText("revenue")).toBeInTheDocument();
    expect(screen.getByText("merger")).toBeInTheDocument();
  });

  it("renders category dropdown options", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    const select = screen.getByLabelText(/Filter by Sector/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Corporate")).toBeInTheDocument();
  });

  it("filters by selected category", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Filter by Sector/i), {
      target: { value: "finance" },
    });
    expect(screen.getByText("revenue")).toBeInTheDocument();
    expect(screen.queryByText("merger")).not.toBeInTheDocument();
  });

  it("renders full card content", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    expect(screen.getByText(/income generated from/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Example: The company’s revenue/i)
    ).toBeInTheDocument();
  });

  it("renders youtube link button", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Öğren/i)[0].closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("business-english/videos/")
    );
  });

  it("calls speech synthesis when Listen is clicked", () => {
    global.SpeechSynthesisUtterance = function (text) {
      this.text = text;
      this.lang = "en-US";
    };
    window.speechSynthesis = {
      speak: vi.fn(),
    };

    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    const listenButtons = screen.getAllByText(/🔊 Listen/i);
    fireEvent.click(listenButtons[0]);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("shows all entries again when 'All Categories' is selected", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    const dropdown = screen.getByLabelText(/Filter by Sector/i);
    fireEvent.change(dropdown, { target: { value: "finance" } });
    expect(screen.queryByText("merger")).not.toBeInTheDocument();
    fireEvent.change(dropdown, { target: { value: "all" } });
    expect(screen.getByText("merger")).toBeInTheDocument();
  });

  it("renders nothing when no entries match the selected category", () => {
    render(
      <MemoryRouter>
        <BusinessEnglish />
      </MemoryRouter>
    );
    const dropdown = screen.getByLabelText(/Filter by Sector/i);
    fireEvent.change(dropdown, { target: { value: "marketing" } });
    expect(screen.queryByText("revenue")).not.toBeInTheDocument();
    expect(screen.queryByText("merger")).not.toBeInTheDocument();
  });
});

describe("BusinessVideos Component (additional)", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            items: [
              {
                id: { videoId: "xyz789" },
                snippet: { title: "Test Video" },
              },
              {
                id: { videoId: "abc123" },
                snippet: { title: "Another Video" },
              },
            ],
          }),
      })
    );
  });

  it("renders multiple iframes if multiple videos", async () => {
    render(
      <MemoryRouter initialEntries={["/business-english/videos/test"]}>
        <Routes>
          <Route
            path="/business-english/videos/:term"
            element={<BusinessVideos />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const iframes = screen.getAllByTitle(/Video/i);
      expect(iframes.length).toBe(2);
    });
  });

  it("renders decoded term in italic in heading", async () => {
    render(
      <MemoryRouter
        initialEntries={["/business-english/videos/financial%20planning"]}
      >
        <Routes>
          <Route
            path="/business-english/videos/:term"
            element={<BusinessVideos />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("financial planning")).toBeInTheDocument();
    });
  });

  it("back button navigates to /business-english", async () => {
    render(
      <MemoryRouter initialEntries={["/business-english/videos/revenue"]}>
        <Routes>
          <Route
            path="/business-english/videos/:term"
            element={<BusinessVideos />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const backBtn = screen.getByRole("button", { name: /geri dön/i });
      expect(backBtn.closest("a")).toHaveAttribute("href", "/business-english");
    });
  });
});
