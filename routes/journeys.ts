import { Router } from 'express';
import comboios from 'comboios';
import nearest from 'nearest-date';

interface JourneyLegOrigin {
  origin: {
    type: string;
    id: string;
    uicId: string;
    name: string;
    timezone: string;
    country: string;
  };
}

interface JourneyLegDestination {
  destination: {
    type: string;
    id: string;
    uicId: string;
    name: string;
    timezone: string;
    country: string;
  };
}

interface JourneyLegLine {
  line: {
    type: string;
    id: string;
    name: string;
    product: string;
    productCode: string;
    mode: string;
    public: boolean;
    operator: {
      type: string;
      id: string;
      name: string;
      url: string;
    };
  };
}

interface JourneyLegStopover {
  type: string;
  stop: {
    type: string;
    id: string;
    uicId: string;
    name: string;
    timezone: string;
    country: string;
  };
  arrival: string;
  arrivalPlatform?: string;
  departure: string;
  departurePlatform?: string;
}

interface JourneyLeg
  extends JourneyLegOrigin,
    JourneyLegDestination,
    JourneyLegLine {
  tripId: string;
  departure: string;
  departurePlatform?: string;
  arrival: string;
  arrivalPlatform?: string;
  mode: string;
  public: boolean;
  operator: {
    type: string;
    id: string;
    name: string;
    url: string;
  };
  stopovers: JourneyLegStopover[];
}

interface JourneyPriceFare {
  class: number;
  amount: number;
  currency: string;
  fareType: number;
  url?: string;
}

interface JourneyPrice {
  price: {
    class: number;
    amount: number;
    currency: string;
    fareType: number;
    url?: string;
    fares: JourneyPriceFare[];
  };
}

interface Journey extends JourneyPrice {
  type: string;
  id: string;
  legs: JourneyLeg[];
}

const router = Router();
const { journeys } = comboios;
const today = new Date();

const getDepartures = (journeys: Journey[]): Date[] => {
  return journeys.map((journey) => new Date(journey.legs[0].departure));
};

const getArrivals = (journeys: Journey[]): Date[] => {
  return journeys.map((journey) => new Date(journey.legs[0].arrival));
};

const getCurrentAndDayAfterJourneys = async (
  originId: string,
  destinationId: string,
  date: Date,
) => {
  const dayAfter = new Date(date || today);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const todayJourneys = await getJourneys(originId, destinationId, date);
  const dayAfterJourneys = await getJourneys(originId, destinationId, dayAfter);

  return [...todayJourneys, ...dayAfterJourneys];
};

const getDateList = (allJourneys: Journey[], byArrival?: boolean) => {
  return !byArrival ? getDepartures(allJourneys) : getArrivals(allJourneys);
};

const getNearestDateIndex = (
  allJourneys: Journey[],
  departure?: Date,
  arrival?: Date,
) => {
  const dateList = getDateList(allJourneys, !!arrival);
  let nextDateIndex = nearest(dateList, arrival || departure || today);
  if (
    (departure &&
      !arrival &&
      dateList[nextDateIndex].getTime() < departure.getTime()) ||
    (arrival && dateList[nextDateIndex].getTime() < arrival.getTime())
  )
    nextDateIndex++;

  return nextDateIndex;
};

const getAllAfterDate = (
  allJourneys: Journey[],
  departure?: Date,
  arrival?: Date,
) => {
  const nextDateIndex = getNearestDateIndex(allJourneys, departure, arrival);
  const journeyList: Journey[] = [];
  for (let i = nextDateIndex; i < allJourneys.length; i++) {
    journeyList.push(allJourneys[i]);
  }
  return journeyList;
};

const getNearestDate = (
  allJourneys: Journey[],
  departure?: Date,
  arrival?: Date,
) => {
  const nextDateIndex = getNearestDateIndex(allJourneys, departure, arrival);

  return allJourneys[nextDateIndex];
};

const getJourneys = async (
  originId: string,
  destinationId: string,
  date?: Date,
): Promise<Journey[]> => journeys(originId, destinationId, { when: date });

const getNextJourney = async (
  originId: string,
  destinationId: string,
  departure?: Date,
  arrival?: Date,
  afterNext?: boolean,
): Promise<Journey | Journey[]> => {
  const allJourneys = await getCurrentAndDayAfterJourneys(
    originId,
    destinationId,
    departure || arrival || today,
  );
  if (afterNext) return getAllAfterDate(allJourneys, departure, arrival);
  return getNearestDate(allJourneys, departure, arrival);
};

router.get('/', async (req, res) => {
  const { originId, destinationId, departure, arrival, next, afterNext } =
    req.query;
  const goingAt = departure ? new Date(departure as string) : today;
  const arrivingAt = arrival ? new Date(arrival as string) : undefined;

  if (next) {
    res.send(
      await getNextJourney(
        originId as string,
        destinationId as string,
        goingAt,
        arrivingAt,
        !!afterNext,
      ),
    );
    return;
  }

  res.send(
    await getJourneys(originId as string, destinationId as string, goingAt),
  );
});

export default router;
