export function testAuth(req, res, next) {
  req.user = {
    id: 1,
    role: "USER",
  };

  next();
}
