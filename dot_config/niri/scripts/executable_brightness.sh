#!/bin/bash

# 引数に応じて輝度を変更 (例: up, down)
if [ "$1" == "up" ]; then
    brightnessctl set 5%+
elif [ "$1" == "down" ]; then
    brightnessctl set 5%-
fi

# 変更後の輝度のパーセンテージを取得 (例: "50%" -> "50")
# brightnessctl -m はカンマ区切りのデータを出力し、4番目がパーセンテージです
current=$(brightnessctl -m | cut -d, -f4 | tr -d '%')

# swaync (notify-send) に通知を送信
# -h int:value:$current : プログレスバーを表示する
# -h string:x-canonical-private-synchronous:brightness : 同じタグの通知を上書きする
notify-send -a "Display" \
            -h string:x-canonical-private-synchronous:brightness \
            -h int:value:"$current" \
            "Brightness" "${current}%"
