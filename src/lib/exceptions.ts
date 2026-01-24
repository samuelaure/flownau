export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Not authenticated') {
        super(message, 401, 'AUTH_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Not authorized') {
        super(message, 403, 'FORBIDDEN_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class IntegrationError extends AppError {
    constructor(service: string, message: string) {
        super(`[${service}] Integration Error: ${message}`, 502, 'INTEGRATION_ERROR');
    }
}
