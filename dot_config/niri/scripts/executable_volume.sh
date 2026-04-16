#!/bin/bash

# 引数に応じて音量を変更
case "$1" in
    up)
        wpctl set-volume -l 1.0 @DEFAULT_AUDIO_SINK@ 5%+
        ;;
    down)
        wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
        ;;
    mute)
        wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
        ;;
esac

# 現在の音量とミュート状態を取得
status=$(wpctl get-volume @DEFAULT_AUDIO_SINK@)
volume=$(echo "$status" | awk '{printf "%.0f", $2 * 100}')

# ミュート状態かどうかで処理を分岐
if echo "$status" | grep -q "MUTED"; then
    icon="audio-volume-muted"
    notify-send -a "Audio" \
                -i "$icon" \
                -h string:x-canonical-private-synchronous:volume \
                -h int:value:0 \
                "Volume: Muted" "0%"
else
    # 音量レベルに応じてアイコンを変更
    if [ "$volume" -ge 67 ]; then
        icon="audio-volume-high"
    elif [ "$volume" -ge 34 ]; then
        icon="audio-volume-medium"
    else
        icon="audio-volume-low"
    fi

    notify-send -a "Audio" \
                -i "$icon" \
                -h string:x-canonical-private-synchronous:volume \
                -h int:value:"$volume" \
                "Volume" "${volume}%"
fi
