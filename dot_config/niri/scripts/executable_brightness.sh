#!/bin/bash

# 引数に応じて輝度を変更
if [ "$1" == "up" ]; then
    brightnessctl set 5%+
elif [ "$1" == "down" ]; then
    brightnessctl set 5%-
fi

# 変更後の輝度のパーセンテージを取得
current=$(brightnessctl -m | cut -d, -f4 | tr -d '%')

# 輝度レベルに応じてアイコンを変更
if [ "$current" -ge 67 ]; then
    icon="display-brightness-high"
elif [ "$current" -ge 34 ]; then
    icon="display-brightness-medium"
else
    icon="display-brightness-low"
fi

# notify-sendに -i オプションでアイコンを渡す
notify-send -a "Display" \
            -i "$icon" \
            -h string:x-canonical-private-synchronous:brightness \
            -h int:value:"$current" \
            "Brightness" "${current}%"
