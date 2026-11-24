import "dotenv/config";
import { createApp } from "./app.js";
const PORT = process.env.PORT || 4000;
createApp().listen(PORT, () => {
  console.log(`Server chal gaya: http://localhost:${PORT}`);
});
