import * as contentType from "./util/contentType";
import * as browser from "./util/browser";
import BaseTech from "./tech/BaseTech";
import HlsJsTech from "./tech/HlsJsTech";
import ShakaTech from "./tech/ShakaTech";
jest.mock("./tech/BaseTech");
jest.mock("./tech/HlsJsTech");
jest.mock("./tech/ShakaTech");

import WebPlayer from "./WebPlayer";
import { ManifestType } from "./util/constants";

describe("WebPlayer core", () => {
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

  it("chooses ShakaTech if MPEG-DASH", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.DASH);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => false);
    jest.spyOn(ShakaTech.prototype, "load").mockImplementation(async () => { });

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream.mpd");
    expect(ShakaTech).toHaveBeenCalledTimes(1);
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

  it("can seek using an absolute position", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream");

    player.seekTo({ position: 10.0 });
    expect(player.currentTime).toEqual(10.0);
  });

  it("can seek using a relative position", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream");

    player.seekTo({ position: 10.0 });
    player.seekTo({ change: 2.0 });
    expect(player.currentTime).toEqual(12.0);
    player.seekTo({ change: -4.0 });
    expect(player.currentTime).toEqual(8.0);
  });

  it("can seek using a percentage", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );

    // We override the get duration() from BaseTech to validate that WebPlayer.seekTo() logic
    // Needs to be done this way as the jest automock does not mock getters/setters
    // unless you have a class instance
    Object.defineProperty(BaseTech.prototype, "duration", {
      get: () => 20
    });
    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream");

    player.seekTo({ percentage: 50 });
    expect(player.currentTime).toEqual(10.0);
  });

  it("sets the property autoplay and muted on the videoelement", async () => {
    jest.spyOn(contentType, "getManifestType").mockImplementation(async () => ManifestType.HLS);
    jest.spyOn(contentType, "canPlayManifestType").mockImplementation(() => true);
    jest.spyOn(browser, "isSafari").mockImplementation(() => true );

    const videoElement = window.document.createElement("video");
    const player = new WebPlayer({ video: videoElement });
    await player.load("mock-stream", true);

    expect(videoElement.muted).toEqual(true);
    expect(videoElement.autoplay).toEqual(true);
  });

});