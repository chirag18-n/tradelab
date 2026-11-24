import { Router } from "express";
const router = Router(); // Router = chhota alag naksha, baad mein app mein jod dete hain
// params: GET /api/practice/hello/Asha
router.get("/hello/:name", (req, res) => {
  res.json({ message: `Namaste ${req.params.name}!` });
});
// query: GET /api/practice/add?a=2&b=3
router.get("/add", (req, res) => {
  const a = Number(req.query.a); // query hamesha text hoti hai, isliye Number() se badlo
  const b = Number(req.query.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return res.status(400).json({ error: "a aur b number hone chahiye" });
  }
  res.json({ sum: a + b });
});
// body: POST /api/practice/echo {"text":"hi"}
router.post("/echo", (req, res) => {
  res.status(201).json({ youSent: req.body });
});
export default router;
