import React, { useEffect, useRef } from "react";
import Avatar from "@mui/material/Avatar";

interface JdenticonAvatarProps {
  text: string;
  color: string;
  src: string;
}

const JAvatar: React.FC<JdenticonAvatarProps> = ({ text, color, src }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    window.jdenticon;
  }, [text]);

  return (
    <Avatar
      variant="circular"
      sx={{
        width: ["40px", "65px"],
        height: ["40px", "65px"],
        border: "3px solid",
        borderColor: color,
      }}
      alt={`${text} avatar`}
      src={
        src
          ? src
          : `data:image/svg+xml;utf8,${encodeURIComponent(
              svgRef.current?.innerHTML || ""
            )}`
      }
    >
      <svg
        ref={svgRef as React.MutableRefObject<SVGSVGElement>}
        data-jdenticon-value={text}
        width={300}
        height={300}
      >
        U
      </svg>
    </Avatar>
  );
};

export default JAvatar;
