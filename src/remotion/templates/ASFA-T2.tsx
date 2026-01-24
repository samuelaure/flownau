import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Loop,
  Audio,
} from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadRaleway } from "@remotion/google-fonts/Raleway";
import { calculateSequenceDuration, TAIL_FRAMES } from "../core/timing.js";

const { fontFamily: frauncesFamily } = loadFraunces("normal", {
  weights: ["700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: ralewayFamily } = loadRaleway("normal", {
  weights: ["400"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

const SimpleText = ({
  text,
  duration,
  noFadeIn = false,
  fontFamily,
  fontWeight = "400",
  letterSpacing = "normal",
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    noFadeIn
      ? [0, Math.max(0.1, duration - 10), duration]
      : [0, 10, Math.max(10.1, duration - 10), duration],
    noFadeIn ? [1, 1, 0] : [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 180px", // Increased for better safe space
      }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        {/* Emoji positioned dynamically above the centered text */}
        {children && (
          <div
            style={{
              position: "absolute",
              bottom: "105%", // Always starts above the top of the text
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {children}
          </div>
        )}

        <h1
          style={{
            fontFamily,
            fontSize: "70px",
            color: "white",
            fontWeight,
            lineHeight: "1.2",
            textShadow: "0px 4px 10px rgba(0,0,0,0.5)",
            margin: 0,
            letterSpacing,
            zIndex: 1,
          }}
        >
          {text}
        </h1>
      </div>
    </AbsoluteFill>
  );
};

const DynamicMessage = ({ text, duration }) => {
  const frame = useCurrentFrame();

  // Granular dynamic font sizing to fit the container accurately across lengths
  const getFontSize = (len) => {
    if (len < 40) return "95px";
    if (len < 80) return "85px";
    if (len < 120) return "75px";
    if (len < 180) return "65px";
    if (len < 250) return "55px";
    if (len < 350) return "45px";
    if (len < 500) return "38px";
    return "30px";
  };

  const opacity = interpolate(
    frame,
    [0, 15, Math.max(15.1, duration - 10), duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "240px 160px 340px 160px", // Reels Safe Zones + increased sides
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%", // Fixed container occupying safe vertical space
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: ralewayFamily,
            fontSize: getFontSize(text.length),
            color: "white",
            fontWeight: "400",
            lineHeight: "1.4",
            textShadow: "0px 2px 8px rgba(0,0,0,0.6)",
            margin: 0,
            whiteSpace: "pre-wrap", // Support for multi-line/paragraphs
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const ASFAT2 = ({
  sequences,
  videoIndex1 = 1,
  videoIndex2 = 2,
  video1Duration = 0,
  video2Duration = 0,
  musicIndex = 1,
  r2BaseUrl = "",
}) => {
  const { hook, message } = sequences;
  const { durationInFrames } = useVideoConfig();

  const hookDuration = calculateSequenceDuration(hook);
  // Give message more time if it's longer
  const messageDuration = durationInFrames - hookDuration;

  // Helper to pad numbers to 4 digits
  const pad = (n) => String(n).padStart(4, "0");

  const bg1 = r2BaseUrl
    ? `${r2BaseUrl}/astrologia_familiar/videos/ASFA_VID_${pad(videoIndex1)}.mp4`
    : staticFile(`background_videos/astro-background-video-${videoIndex1}.mp4`);

  const bg2 = r2BaseUrl
    ? `${r2BaseUrl}/astrologia_familiar/videos/ASFA_VID_${pad(videoIndex2)}.mp4`
    : staticFile(`background_videos/astro-background-video-${videoIndex2}.mp4`);

  const music = r2BaseUrl
    ? `${r2BaseUrl}/astrologia_familiar/audios/ASFA_AUD_${pad(musicIndex)}.m4a`
    : staticFile(`background_music/astro-background-music-${musicIndex}.mp3`);

  // Simple conditional loop component
  const SmartVideo = ({ src, videoDuration, fillDuration }) => {
    const vDuration = Math.round(videoDuration);
    const fDuration = Math.round(fillDuration);

    // If we have duration and it's shorter than what we need, loop it
    if (vDuration > 0 && vDuration < fDuration) {
      return (
        <Loop durationInFrames={vDuration}>
          <OffthreadVideo
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted
          />
        </Loop>
      );
    }
    // Otherwise just play it
    return (
      <OffthreadVideo
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        muted
      />
    );
  };

  return (
    <AbsoluteFill>
      <Loop durationInFrames={durationInFrames}>
        <Audio src={music} volume={0.5} />
      </Loop>

      <Sequence from={0} durationInFrames={hookDuration}>
        <AbsoluteFill>
          <SmartVideo
            src={bg1}
            videoDuration={video1Duration}
            fillDuration={hookDuration}
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={hookDuration} durationInFrames={messageDuration}>
        <AbsoluteFill>
          <SmartVideo
            src={bg2}
            videoDuration={video2Duration}
            fillDuration={messageDuration}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Dark Overlay */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
          }}
        />
      </AbsoluteFill>

      {/* Sequence 1: Hook + Emoji */}
      <Sequence from={0} durationInFrames={hookDuration}>
        <SimpleText
          text={hook}
          duration={hookDuration}
          noFadeIn={true}
          fontFamily={frauncesFamily}
          fontWeight="700"
          letterSpacing="0.03em"
        >
          <div style={{ fontSize: "140px" }}>✉️</div>
        </SimpleText>
      </Sequence>

      {/* Sequence 2: Message */}
      <Sequence from={hookDuration} durationInFrames={messageDuration}>
        <DynamicMessage text={message} duration={messageDuration} />
      </Sequence>
    </AbsoluteFill>
  );
};
