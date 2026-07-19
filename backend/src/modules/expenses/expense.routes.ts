import { Router } from 'express';
import { expenseController } from './expense.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

export const expenseRouter = Router();
expenseRouter.use(authenticate);

expenseRouter.get('/', requirePermission('expenses:read'), (req, res, next) => expenseController.getAll(req, res, next));
expenseRouter.get('/cost-breakdowns', requirePermission('expenses:read'), (req, res, next) => expenseController.getCostBreakdowns(req, res, next));
expenseRouter.post('/', requirePermission('expenses:write'), (req, res, next) => expenseController.create(req, res, next));
expenseRouter.delete('/:id', requirePermission('expenses:delete'), (req, res, next) => expenseController.remove(req, res, next));
