import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import RequestGeneration from "../../src/components/RequestGeneration";
import { api } from "../../src/api";

// Mock the API (use Vitest's `vi`)
vi.mock("../../src/api");
const mockedApi = api as unknown as Record<string, any>;

describe("RequestGeneration Component", () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <RequestGeneration />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getMetadata to return app configuration
    mockedApi.getMetadata = vi.fn().mockResolvedValue({
      captchaEnabled: true,
      turnstileSiteKey: "test-site-key",
    });
  });

  it("renders the form correctly", async () => {
    renderComponent();

    expect(screen.getByText(/CipherShare/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email Address/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/What secret are you requesting/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Retention Policy/i)).toBeInTheDocument();
    
    // Wait for the async metadata fetch to complete
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });
  });

  it("allows user to fill out the form", async () => {
    renderComponent();

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const descriptionInput = screen.getByPlaceholderText(/WiFi password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test secret description" },
    });

    expect(emailInput).toHaveValue("test@example.com");
    expect(descriptionInput).toHaveValue("Test secret description");
    
    // Wait for the async metadata fetch to complete
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });
  });

  it("submits the form and displays shareable URL", async () => {
    // Mock metadata with CAPTCHA disabled for easier testing
    mockedApi.getMetadata.mockResolvedValue({
      captchaEnabled: false,
      turnstileSiteKey: undefined,
    });

    const mockResponse = {
      requestId: "123-456-789",
      shareableUrl: "http://localhost:5173/request/123-456-789",
      retrievalUrl: "http://localhost:5173/retrieve/abc-def-ghi",
    };

    mockedApi.createRequest.mockResolvedValue(mockResponse);

    renderComponent();

    // Wait for metadata to load
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const descriptionInput = screen.getByPlaceholderText(/WiFi password/i);
    const submitButton = screen.getByText(/Generate Request Link/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(descriptionInput, { target: { value: "Test secret" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Request Created!/i)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(mockResponse.shareableUrl)
      ).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    // Mock metadata with CAPTCHA disabled for easier testing
    mockedApi.getMetadata.mockResolvedValue({
      captchaEnabled: false,
      turnstileSiteKey: undefined,
    });

    mockedApi.createRequest.mockRejectedValue(new Error("Network error"));

    renderComponent();

    // Wait for metadata to load
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const descriptionInput = screen.getByPlaceholderText(/WiFi password/i);
    const submitButton = screen.getByText(/Generate Request Link/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(descriptionInput, { target: { value: "Test secret" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("allows user to create another request after success", async () => {
    // Mock metadata with CAPTCHA disabled for easier testing
    mockedApi.getMetadata.mockResolvedValue({
      captchaEnabled: false,
      turnstileSiteKey: undefined,
    });

    const mockResponse = {
      requestId: "123-456-789",
      shareableUrl: "http://localhost:5173/request/123-456-789",
      retrievalUrl: "http://localhost:5173/retrieve/abc-def-ghi",
    };

    mockedApi.createRequest.mockResolvedValue(mockResponse);

    renderComponent();

    // Wait for metadata to load
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const descriptionInput = screen.getByPlaceholderText(/WiFi password/i);
    const submitButton = screen.getByText(/Generate Request Link/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(descriptionInput, { target: { value: "Test secret" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Request Created!/i)).toBeInTheDocument();
    });

    const resetButton = screen.getByText(/Create Another Request/i);
    fireEvent.click(resetButton);

    expect(screen.getByText(/Generate Request Link/i)).toBeInTheDocument();
  });

  it("works without CAPTCHA when disabled", async () => {
    // Mock metadata with CAPTCHA disabled
    mockedApi.getMetadata.mockResolvedValue({
      captchaEnabled: false,
      turnstileSiteKey: undefined,
    });

    const mockResponse = {
      requestId: "123-456-789",
      shareableUrl: "http://localhost:5173/request/123-456-789",
      retrievalUrl: "http://localhost:5173/retrieve/abc-def-ghi",
    };

    mockedApi.createRequest.mockResolvedValue(mockResponse);

    renderComponent();

    // Wait for metadata to load
    await waitFor(() => {
      expect(mockedApi.getMetadata).toHaveBeenCalled();
    });

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const descriptionInput = screen.getByPlaceholderText(/WiFi password/i);
    const submitButton = screen.getByText(/Generate Request Link/i);

    // Verify submit button is not disabled (no CAPTCHA required)
    expect(submitButton).not.toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(descriptionInput, { target: { value: "Test secret" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Request Created!/i)).toBeInTheDocument();
    });

    // Verify the API was called without a turnstileToken
    expect(mockedApi.createRequest).toHaveBeenCalledWith(
      expect.not.objectContaining({ turnstileToken: expect.anything() })
    );
  });
});
