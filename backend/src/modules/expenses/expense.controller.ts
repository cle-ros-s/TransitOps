import type { Request, Response, NextFunction } from 'express';
import { expenseService } from './expense.service';
import { sendSuccess } from '../../utils/apiResponse';

export class ExpenseController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await expenseService.findAll(req.query as never);
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await expenseService.create(req.body), 201);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await expenseService.delete(req.params.id);
      sendSuccess(res, { message: 'Expense deleted' });
    } catch (err) { next(err); }
  }

  async getCostBreakdowns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await expenseService.getCostBreakdowns());
    } catch (err) { next(err); }
  }
}

export const expenseController = new ExpenseController();
