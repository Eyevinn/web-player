import { isSafari } from "./browser";

describe("browser utils", () => {
  it("can correctly detect Safari", () => {
    jest.spyOn(window.navigator, "userAgent", "get")
    .mockImplementationOnce(() => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15")
    .mockImplementationOnce(() => "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25")
    .mockImplementationOnce(() => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36")

    jest.spyOn(window.navigator, "vendor", "get")
    .mockImplementationOnce(() => "Apple Computer, Inc.")
    .mockImplementationOnce(() => "Apple Computer, Inc.")
    .mockImplementationOnce(() => "Google Inc.")

    expect(isSafari()).toBe(true);
    expect(isSafari()).toBe(true);
    expect(isSafari()).toBe(false);
  });
});