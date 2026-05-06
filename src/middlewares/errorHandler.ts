export function errorHandler(err: Error, req: any, res: any) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal Server Error', ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
}