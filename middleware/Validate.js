export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    console.log(req.params.id)
    console.error('Validation error:', result.error.errors);
    return res.status(400).json({
      message: "Validation error",
      error: result.error.errors,
    });
  }

  req.body = result.data; 
  next();
};


export default validate;