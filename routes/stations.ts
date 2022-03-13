import { Router } from 'express';
import comboios from 'comboios';
import Fuse from 'fuse.js';

const router = Router();
const { stations } = comboios;

interface StationLocation {
  location: {
    type: string;
    longitude: number;
    latitude: number;
  };
}

interface Station extends StationLocation {
  type: string;
  id: string;
  uicId: string;
  name: string;
  timezone: string;
  country: string;
}

export const getAllStations = async (): Promise<Station[]> => stations();

export const searchStation = async (search: string) => {
  const stationList = await getAllStations();

  const fuseOptions = {
    threshold: 0.1,
    keys: ['name'],
  };

  const fuse = new Fuse(stationList, fuseOptions);

  return fuse.search(search);
};

router.get('/', async (req, res) => {
  const { stationToSearch } = req.query;

  if (!stationToSearch) {
    res.send(await getAllStations());
    return;
  }

  res.send(await searchStation(stationToSearch as string));
});

export default router;
