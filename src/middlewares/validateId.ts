export function validateId(req: any, res: any, next: any) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ message: "Invalid game id" });

    req.validatedId = id;
    next();
}