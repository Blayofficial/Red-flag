export type RootStackParamList = {
  Home: undefined;
  Results: {
    fromStationId: string;
    fromName: string;
    toStationId: string;
    toName: string;
    barrierFreeMode: boolean;
  };
  StationDetails: {
    stationId: string;
  };
};
