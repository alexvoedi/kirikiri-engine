; Test the image command and the position command

*start

[macro name=mesframe]
[layopt layer=3 page=fore visible=true autohide=true]
[image storage="transparent.png" page=fore layer=3 opacity=0]
[move layer=3 time=1000 path="(0,0,255)"]
[wm]
[endmacro]

[macro name=drawchar]
[layopt layer=3 visible=true]
[backlay]
[trans time=1000 method=crossfade]
[endmacro]

; Set the background image
[image layer=base page=back storage="bosse.png"]

[freeimage layer=3 page=back]

[mesframe]
[wait time=1000]
[drawchar]

[s]
