import {
    getRecurringTasks, 
    todayTasksController,
    updatePriority,
    updateDependentTasks,
    updateNextRecurDate
} from '../controllers/dailyTasks.controllers.js';
import express from 'express';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.route('/recurring').get(
    verifyToken,
    getRecurringTasks
);
router.route('/today').get(
    verifyToken,
    todayTasksController
);
router.route('/update-priority').post(
    verifyToken,
    updatePriority
);
router.route('/update-dependent-tasks').post(   
    verifyToken,
    updateDependentTasks
);
router.route('/update-next-recur-date').post(
    verifyToken,
    updateNextRecurDate
);

export default router;