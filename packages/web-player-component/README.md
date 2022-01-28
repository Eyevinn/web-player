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

## Contribution

You are welcome to either contribute to this project or spin-off a fork of your own. This code is released under the Apache 2.0 license.

```
Copyright 2018 Eyevinn Technology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!  