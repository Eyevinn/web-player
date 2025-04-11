import { enableFetchMocks } from "jest-fetch-mock";
enableFetchMocks();

import { getManifestType, canPlayManifestType } from "./contentType";
import { ManifestType } from "./constants";

function setupContentTypeResponseMock(contentType) {
  fetchMock.mockOnce(async () => {
    return {
      headers: {
        "Content-Type": contentType
      }
    }
  });
}

describe("content type utils", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("can choose correct manifest type based on content-type headers", async () => {
    setupContentTypeResponseMock("application/x-mpegURL");
    expect(await getManifestType("hls.m3u8")).toEqual(ManifestType.HLS);
    setupContentTypeResponseMock("application/vnd.apple.mpegurl");
    expect(await getManifestType("hls.m3u8")).toEqual(ManifestType.HLS);
    setupContentTypeResponseMock("application/vnd.apple.mpegurl;charset=UTF-8");
    expect(await getManifestType("hls.m3u8")).toEqual(ManifestType.HLS);
    setupContentTypeResponseMock("application/dash+xml");
    expect(await getManifestType("manifest")).toEqual(ManifestType.DASH);
    setupContentTypeResponseMock("application/vnd.ms-sstr+xml");
    expect(await getManifestType("manifest")).toEqual(ManifestType.MSS);

    // If content-type is not specified fallback to determine on file suffix
    setupContentTypeResponseMock("");
    expect(await getManifestType("hls.m3u8")).toEqual(ManifestType.HLS);
    setupContentTypeResponseMock("");
    expect(await getManifestType("manifest.mpd")).toEqual(ManifestType.DASH);
    setupContentTypeResponseMock("");
    expect(await getManifestType("/Manifest")).toEqual(ManifestType.MSS);
    setupContentTypeResponseMock("");
    expect(await getManifestType("/manifest")).toEqual(ManifestType.MSS);

    // If content-type is too general fallback to determine on file suffix
    setupContentTypeResponseMock("binary/octet-stream");
    expect(await getManifestType("hls.m3u8")).toEqual(ManifestType.HLS);
    setupContentTypeResponseMock("binary/octet-stream");
    expect(await getManifestType("manifest.mpd")).toEqual(ManifestType.DASH);
    setupContentTypeResponseMock("binary/octet-stream");
    expect(await getManifestType("/Manifest")).toEqual(ManifestType.MSS);
    setupContentTypeResponseMock("binary/octet-stream");
    expect(await getManifestType("/manifest")).toEqual(ManifestType.MSS);

    // If it can't be decided we should get unknown
    setupContentTypeResponseMock("application/octet-stream");
    expect(await getManifestType("fil.ts")).toEqual(ManifestType.UNKNOWN);
    setupContentTypeResponseMock("");
    expect(await getManifestType("fil.mp4")).toEqual(ManifestType.UNKNOWN);

  });

  it("can check whether browser has native support for streaming format", () => {
    const canPlayTypeStub = jest
    .spyOn(window.HTMLVideoElement.prototype, "canPlayType")
    .mockImplementation((type) => { return "probably" });

    expect(canPlayManifestType(ManifestType.HLS)).toEqual(true);
    expect(canPlayTypeStub).toHaveBeenLastCalledWith("application/vnd.apple.mpegurl");
    expect(canPlayManifestType(ManifestType.DASH)).toEqual(true);
    expect(canPlayTypeStub).toHaveBeenLastCalledWith("application/dash+xml");
    canPlayTypeStub.mockRestore()
  });
});