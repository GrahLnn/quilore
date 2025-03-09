import type React from "react";
import LazyLoad from "react-lazyload";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  ratio: [number, number];
  offset?: number | number[];
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  ratio,
  offset = 700,
  ...props
}) => {
  const [w, h] = ratio;

  const style = {
    width: "100%",
    aspectRatio: `${w} / ${h}`,
  };

  return (
    <LazyLoad
      unmountIfInvisible
      offset={offset}
      placeholder={<div style={style} />}
      style={style}
    >
      {/* biome-ignore lint/a11y/useAltText: <explanation> */}
      <img src={src} {...props} />
    </LazyLoad>
  );
};

export default LazyImage;
