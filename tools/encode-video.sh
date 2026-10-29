#!/bin/sh
# Living paintings: shrink the accepted Runway clips (art_review/video, see Runway_Video_Summary.pdf)
# for the web: H.264 (and VP9 WebM), at most 1280 wide, no sound, fast start, into game/video/<painting key>.mp4.
# The spring fair and Virata's court use their trimmed copies (people walk in later).
set -e
cd "$(dirname "$0")/.."
while read key file; do
  src="art_review/video/video_$key/$file"
  out="game/video/$key.mp4"
  ffmpeg -nostdin -loglevel error -y -i "$src" -an -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset veryfast -crf 29 -pix_fmt yuv420p -movflags +faststart "$out"
  # WebM (VP9) as well, for browsers without H.264 (some Linux builds of Chromium, test browsers).
  ffmpeg -nostdin -loglevel error -y -i "$src" -an -vf "scale='min(1280,iw)':-2" -c:v libvpx-vp9 -crf 40 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 "game/video/$key.webm"
  echo "$key  $file  $(du -h "$out" | cut -f1)  $(du -h "game/video/$key.webm" | cut -f1)"
done <<'LIST'
war_eve video_war_eve_try1.mp4
scene_dice_hall video_scene_dice_hall_try2.mp4
scene_poison video_scene_poison_try2.mp4
scene_lac video_scene_lac_try3.mp4
scene_dice_cloth video_scene_dice_cloth_try1.mp4
war_day17 video_war_day17_try2.mp4
scene_arrows video_scene_arrows_try1.mp4
end_death video_end_death_try1.mp4
end_survivor video_end_survivor_try1.mp4
end_broken video_end_broken_try1.mp4
end_elder video_end_elder_try1.mp4
end_forest video_end_forest_try1.mp4
end_river video_end_river_try1.mp4
scene_princes video_scene_princes_try2.mp4
scene_fair video_scene_fair_try1_6s.mp4
scene_teacher video_scene_teacher_try1.mp4
scene_teaching video_scene_teaching_try1.mp4
scene_tournament video_scene_tournament_try1.mp4
scene_swayamvara video_scene_swayamvara_try1.mp4
scene_indraprastha video_scene_indraprastha_try1.mp4
scene_dice_throws video_scene_dice_throws_try2.mp4
scene_exile video_scene_exile_try1.mp4
scene_virata video_scene_virata_try1_7s.mp4
scene_day13 video_scene_day13_try1.mp4
war_day18 video_war_day18_try1.mp4
LIST
