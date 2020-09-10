import WebPlayer from "@eyevinn/web-player-core";
import EyevinnSkin from "@eyevinn/web-player-eyevinn-skin";

async function main() {
  const hlsButton = document.querySelector("#hls-button");
  const dashButton = document.querySelector("#dash-button");
  const mssButton = document.querySelector("#mss-button");

  const manifestInput = document.querySelector("#manifest-input");
  const loadButton = document.querySelector("#load-button");

  const video = document.querySelector("video");
  const player = new WebPlayer({ video });
  new EyevinnSkin({
    wrapper: document.querySelector("#player"),
    player,
  });

  function load() {
    player.load(manifestInput.value);
  }

  hlsButton.onclick = async () => {
    manifestInput.value =
      "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8";
    load();
  };
  dashButton.onclick = async () => {
    manifestInput.value =
      "https://storage.googleapis.com/shaka-demo-assets/sintel-mp4-only/dash.mpd";
    load();
  };

  mssButton.onclick = async () => {
    manifestInput.value =
      "http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest";
    load();
  };

  loadButton.onclick = () => load();
}

window.onload = main;
