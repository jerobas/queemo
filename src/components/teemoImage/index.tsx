import { useEffect, useState } from "react";
import { ISession } from "../../interfaces";
import { GamePhase, Images } from "../../interfaces";

import { BASE_URL } from "../../interfaces";

interface TeemoImageProps {
  data?: ISession;
}

const getImageSrc = (phase?: string) => {
  const imageMap: Partial<Record<GamePhase, Images>> = {
    [GamePhase.INPROGRESS]: Images.INGAME,
    [GamePhase.LOBBY]: Images.LOBBY,
    [GamePhase.CHAMPSELECT]: Images.QUEUE,
    [GamePhase.MATCHMAKING]: Images.QUEUE,
  };

  const image = imageMap[phase as GamePhase] || Images.MENU;

  return `http://${BASE_URL}:3099/${image}`;
};

const TeemoImage = ({ data }: TeemoImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    setImageSrc(getImageSrc(data?.phase));
  }, [data?.phase]);

  return <img src={imageSrc} alt="Teemo Phase" />;
};

export default TeemoImage;
