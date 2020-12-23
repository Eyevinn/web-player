# Player 

The player package is the package that aggregates all the differences packages into one simple to use module.

## Getting started 

### NPM
TODO...

### CDN 
Download the latest release of this package and include the javascript & css files in your HTML.

The snippet below shows an example on how to implement the player
```html
<html>
<head>
  <!-- Eyevinn WebPlayer CSS -->
  <link rel="stylesheet" href="webplayer.css"></link>
</head>
<body>
  <!-- The element where the player will be placed -->
  <div id="player-wrapper"></div>

  <!-- Eyevinn WebPlayer Javascript -->
  <script src="webplayer.min.js" type="text/javascript"></script>

  <!-- Initiate the player and auto-play with audio muted -->
  <script>
    document.addEventListener('DOMContentLoaded', function(event) {
      const player = webplayer(document.querySelector("#player-wrapper"));
      player.load(src).then(function() {
        player.play();
      });
    });
  </script>
</body>
</html>
```