export const paginate = (request) => {
  const offset = request.query.offset;
  const limit = request.query.limit;
  return {
    offset,
    limit,
  };
};
