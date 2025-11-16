import {
  stationsGetQueryParams,
  stationsGetPathParams,
} from '@peloton/shared';
import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getStations, getStationDetail } from '../../services/stationService.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/', async (req: Request, res: Response) => {
  try {
    const validationResult = stationsGetQueryParams.safeParse(req.query);

    if (!validationResult.success) {
      logger.warn('Invalid query parameters for GET /stations', {
        query: req.query,
        errors: validationResult.error.flatten(),
      });

      res.status(StatusCodes.BAD_REQUEST).json({
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { bounds, format } = validationResult.data;

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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching stations',
      },
    });
  }
});


// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/:stationId', async (req: Request, res: Response) => {
  try {
    const validationResult = stationsGetPathParams.safeParse(req.params);

    if (!validationResult.success) {
      logger.warn('Invalid path parameters for GET /stations/:stationId', {
        params: req.params,
        errors: validationResult.error.flatten(),
      });

      res.status(StatusCodes.BAD_REQUEST).json({
        error: {
          code: 'INVALID_STATION_ID',
          message: 'Invalid station ID format',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { stationId } = validationResult.data;

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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching station details',
      },
    });
  }
});

export default router;
