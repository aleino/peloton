import {
  stationsGetQueryParams,
  stationsGetPathParams,
  type StationsGetQueryParams,
  type StationsGetPathParams,
} from '@peloton/shared';
import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { validateQuery, validateParams } from '../../middleware/validation.js';
import { getStations, getStationDetail } from '../../services/stationService.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/', validateQuery(stationsGetQueryParams), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Query params are already validated by middleware
    const { bounds, format } = req.query as StationsGetQueryParams;

    const result = await getStations({ bounds, format });

    logger.debug('Successfully fetched stations', {
      count: 'features' in result ? result.features.length : result.stations.length,
      format,
      hasBounds: !!bounds,
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid bounds')) {
      logger.warn('Invalid bounds parameter', { error: error.message });

      res.status(StatusCodes.BAD_REQUEST).json({
        error: {
          code: 'INVALID_BOUNDS',
          message: error.message,
        },
      });
      return;
    }

    logger.error('Error fetching stations:', error);
    next(error);
  }
});


// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/:stationId', validateParams(stationsGetPathParams), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Params are already validated by middleware
    const { stationId } = req.params as StationsGetPathParams;

    const station = await getStationDetail(stationId);

    if (!station) {
      logger.debug(`Station not found: ${stationId}`);

      res.status(StatusCodes.NOT_FOUND).json({
        error: {
          code: 'STATION_NOT_FOUND',
          message: `Station with ID "${stationId}" not found`,
        },
      });
      return;
    }

    logger.debug(`Successfully fetched station detail`, {
      stationId,
      name: station.name,
    });

    res.status(StatusCodes.OK).json(station);
  } catch (error) {
    logger.error(`Error fetching station ${req.params.stationId}:`, error);
    next(error);
  }
});

export default router;
