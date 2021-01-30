export default {
  results: [
    {
      desc: "Bulk Carrier [BS]",
      type: "Vessel",
      typeId: 1,
      url: "/en/ais/details/ships/shipid:372738",
      value: "DRAWSKO",
      id: 372738,
      meta: { typeColorId: 7 },
      inFleet: 0,
      userId: null,
    },
  ],
  hasMoreResults: false,
};

const ShipData = {
  etaReported: 1612072800,
  etaReportedOffset: 60,
  etaCalc: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["VoyageForecastService"] },
  },
  etaCalcOffset: 60,
  etaCalcSpeed: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["VoyageForecastService"] },
  },
  etd: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["VoyageForecastService"] },
  },
  etdOffset: 60,
  reportedDestination: "TN SFA",
  distanceTraveled: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["VoyageForecastService"] },
  },
  distanceToGo: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["VoyageForecastService"] },
  },
  progress: 77.163636363636357,
  departurePort: {
    id: "882",
    name: "CHORNOMORSK",
    code: "ILK",
    timestamp: 1611631440,
    offset: 120,
    timestampLabel: "ATD",
    countryCode: "UA",
  },
  arrivalPort: {
    id: "2503",
    name: "SFAX",
    code: "SFA",
    timestamp: 1612072800,
    offset: 60,
    timestampLabel: "ETA",
    countryCode: "TN",
  },
  recordedMaxSpeed: 11.800000000000001,
  recordedAverageSpeed: 10.4,
  trackType: 7,
  lpt: 1611631440,
  estimatedRouteFound: true,
  isClassB: false,
  draughtReported: 10.199999999999999,
  vesselName: "DRAWSKO",
  staticDataReceivedTimestamp: 1611900519,
  staticDataReceivedTimezoneOffset: 60,
  loadCondition: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["LoadConditionService"] },
  },
  draughtMax: {
    inaccessibleDataFragment: true,
    reasons: { missingService: ["LoadConditionService"] },
  },
};
