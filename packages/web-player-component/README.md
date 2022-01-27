# A Web Component for the Eyevinn WebPlayer

This web component is powered by the Eyevinn WebPlayer and can be used on an HTML-page by using the `<eyevinn-video></eyevinn-video>` tag.

## Attributes

| ATTRIBUTE NAME           | VALUE    | DESCRIPTION                                                        |
| ------------------------ | -------- | ------------------------------------------------------------------ |
| `source`                 | URL      | Specifies the URL of the source media stream                       |
| `starttime`              | seconds  | Specifies where in the timeline to start playing the stream        |
| `autoplay`               | autoplay | Specifies that the video will start playing as soon as it is ready |
| `muted`                  | muted    | Specifies that the audio output of the video should be muted       |

## Example

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Web Player Component Demo</title>
</head>
<body scroll="no">
    <!-- Import the web component script --->
    <script type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@0.0.1/dist/web-player.component.js"></script>
    <!-- Use the 'eyevinn-video' element as such --->
    <eyevinn-video source="https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8" starttime="30" muted autoplay></eyevinn-video>

</body>
</html>
```

Run `npm install && npm run dev` in the root of this repository to see it in action!
