// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyCodeButton } from "./CopyCodeButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubClipboard(writeText: (text: string) => Promise<void>) {
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
}

describe("CopyCodeButton", () => {
  it("copies the exact code and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyCodeButton code={"Set(x, 1)\n"} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    });
    expect(writeText).toHaveBeenCalledWith("Set(x, 1)\n");
    expect(screen.getByRole("status").textContent).toBe("Copied");
    expect(screen.getByRole("button", { name: "Copy code" }).textContent).toBe("Copied");
  });

  it("falls back to selection-based copy when the Clipboard API is blocked", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;
    render(<CopyCodeButton code="x" />);
    const button = screen.getByRole("button", { name: "Copy code" });
    button.focus(); // a real click focuses the button; a synthetic one does not
    await act(async () => {
      fireEvent.click(button);
    });
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("status").textContent).toBe("Copied");
    // The temporary textarea is removed and focus goes back to the button.
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Copy code" }));
  });

  it("says so when no way of copying is allowed", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    document.execCommand = vi.fn().mockReturnValue(false);
    render(<CopyCodeButton code="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    });
    expect(screen.getByRole("status").textContent).toMatch(/copy failed/i);
  });
});
