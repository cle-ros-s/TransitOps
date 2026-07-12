"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.body)
                req.body = schemas.body.parse(req.body);
            if (schemas.query)
                req.query = schemas.query.parse(req.query);
            if (schemas.params)
                req.params = schemas.params.parse(req.params);
            return next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: {
                        message: 'Validation error',
                        code: 'VALIDATION_ERROR',
                        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
                    },
                });
                return;
            }
            return next(err);
        }
    };
}
