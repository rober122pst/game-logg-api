

export function validateId(paramName: string) {
    return (req: any, res: any, next: any) => {
        const id = req.params[paramName];

        if (!id || typeof id !== "string") {
            return res.status(400).json({ message: `Invalid ${paramName}` });
        }

        (req as any).validatedId = id;
        next();
    }
}