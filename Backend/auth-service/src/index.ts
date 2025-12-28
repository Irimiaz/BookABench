import dotenv from "dotenv";
import server from "./server.js";

dotenv.config();

const port = Number(process.env.PORT) || "NO_ENV_FOUND";

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
