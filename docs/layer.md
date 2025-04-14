# Layer

Every layer has two pages: fore and back.

The fore page is the currently displayed portion. This is what is visible to the user.
The back page is the part that will be displayed when the transition is performed.

A transition is a function that transfers th econtent drawn on the back page to the fore page

Example:

```kag
[image storage="red" layer="base" page="fore"]
[image storage="blue" layer="base" page="back"]
[trans method="crossfade" time="1000"]
```

First the red image is visible, because it is in the front. Then the blue image is loaded to the back, but not visible. Then the transition is performed. The red image fades out and the blue image becomes visible. The blue image now becoms the new fore page.

In most cases transitions are done like this:

```kag
これからトランジションを開始します。
[backlay]
[image storage="hoge" layer="base" page="back"]
[trans method="crossfade" time="2000"]
[wt]
トランジションを完了しました。
```

Why does this work? The `backlay` command copies ALL information of the fore from ALL layers (except if a specific layer is specified) to the back in all layers. Then a new image is loaded, but only into one back layer. Then all transitions are performed. All layers are transitioned, but it look like only one layer is transitioned, because only one layer has a difference between fore and back.
