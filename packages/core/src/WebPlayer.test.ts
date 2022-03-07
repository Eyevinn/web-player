import { enableFetchMocks } from "jest-fetch-mock";
enableFetchMocks();

import * as contentType from "./util/contentType";
import * as browser from "./util/browser";
import BaseTech from "./tech/BaseTech";
jest.mock("./tech/BaseTech");
import HlsJsTech from "./tech/HlsJsTech";
jest.mock("./tech/HlsJsTech");

import WebPlayer from "./WebPlayer";
import { ManifestType } from "./util/constants";

describe("WebPlayer core", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("chooses BaseTech if HLS and Safari", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );
    jest.spyOn(BaseTech.prototype, "load").mockImplementation(async () => { });

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream");
    expect(BaseTech).toHaveBeenCalledTimes(1);
  });

  it("chooses HlsJsTech if HLS and not Safari", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => false);
    jest.spyOn(HlsJsTech.prototype, "load").mockImplementation(async () => { });

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream.m3u8");
    expect(HlsJsTech).toHaveBeenCalledTimes(1);
  });

  it("can be played inline on mobile browsers", async () => {
    // Setup necessary mockups
    const setAttributeStub = jest
      .spyOn(window.HTMLVideoElement.prototype, "setAttribute")
      .mockImplementation(() => {});
    // Mock tech decisions to fall on Safari
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );
    jest.spyOn(BaseTech.prototype, "load").mockImplementation(async () => { });

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream");
    expect(BaseTech).toHaveBeenCalledTimes(1);
    expect(setAttributeStub).toHaveBeenCalledWith("playsinline", "");
    setAttributeStub.mockRestore();
  });
});