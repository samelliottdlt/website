export interface Game {
  id: number;
  title: string;
  platform: string;
  status: "Playing" | "Completed" | "Dropped" | "Paused" | "Plan to Play";
  type?: string;
}

export interface GameData {
  current: Game[];
  played: {
    [year: string]: Game[];
  };
}

const data: GameData = {
  current: [
    {
      id: 1,
      title: "Valorant",
      platform: "PC",
      status: "Playing",
      type: "multiplayer",
    },
    {
      id: 2,
      title: "Overwatch 2",
      platform: "PC",
      status: "Playing",
      type: "multiplayer",
    },
    {
      id: 3,
      title: "Granblue Fantasy Relink",
      platform: "PC",
      status: "Playing",
      type: "multiplayer",
    },
    {
      id: 4,
      title: "Resident Evil 2",
      platform: "PC",
      status: "Playing",
      type: "singleplayer",
    },
    {
      id: 5,
      title: "Hades 2",
      platform: "PC",
      status: "Playing",
      type: "singleplayer",
    },
    {
      id: 6,
      title: "Persona 5",
      platform: "Switch",
      status: "Playing",
      type: "singleplayer",
    },
  ],
  played: {
    "2024": [
      {
        id: 7,
        title: "Resident Evil 4",
        platform: "PC",
        status: "Completed",
      },
    ],
  },
};

export default data;
