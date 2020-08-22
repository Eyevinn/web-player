import WebPlayer from "@eyevinn/web-player-core";
import EyevinnSkin from "@eyevinn/web-player-eyevinn-skin";

async function main() {
  const hlsButton = document.querySelector("#hls-button");
  const dashButton = document.querySelector("#dash-button");
  const mssButton = document.querySelector("#mss-button");

  const video = document.querySelector("video");
  const player = new WebPlayer({ video });
	new EyevinnSkin({
		wrapper: document.querySelector("#player"),
		player
	})

  hlsButton.onclick = async () =>
    await player.load(
      "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8"
    );
  dashButton.onclick = async () =>
    await player.load(
      "https://storage.googleapis.com/shaka-demo-assets/sintel-mp4-only/dash.mpd"
    );
  mssButton.onclick = async () =>
    await player.load(
      "http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest"
    );
}

window.onload = main;

