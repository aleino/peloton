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

router.get(
  '/',
  validateQuery(stationsGetQueryParams),
  (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        // Query params are already validated by middleware
        const { bounds } = req.query as StationsGetQueryParams;

        const result = await getStations({ bounds });

        logger.debug('Successfully fetched stations as GeoJSON', {
          count: result.features.length,
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
    })();
  }
);

router.get(
  '/:stationId',
  validateParams(stationsGetPathParams),
  (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
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
    })();
  }
);

export default router;
