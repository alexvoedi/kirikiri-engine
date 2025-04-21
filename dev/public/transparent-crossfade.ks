; Test the image command and the position command

*start

[macro name=mesframe]
[position layer=message0 page=fore frame="" left=20 top=465 width=768 height=105 opacity=0]
[layopt layer=3 page=fore visible=true autohide=true]
[image storage="transparent.png" page=fore layer=3 left=0 top=0 opacity=0]
[move layer=3 time=650 path="(0,0,255)"]
[wm]
[endmacro]

[macro name=drawchar]
[layopt layer=3 visible=true]
[layopt layer=message0 visible=true]
[backlay]
[image storage="bosse.png" page=back left=0 top=0 layer=0 visible=true]
[trans time=600 method=crossfade]
[wt]
[endmacro]

[macro name=change]
[ct]
[position layer=message0 page=back frame="" opacity=0]
[image storage="bosse.png" page=back layer=base]
[trans time=100 method=crossfade]
[endmacro]

[freeimage layer=0 page=back]
[freeimage layer=3 page=back]
[change]
[mesframe]
[drawchar]

[s]
