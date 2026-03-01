import { server } from "./app";
import { config } from "./config";

server.listen(Number(config.PORT), "0.0.0.0", () => {
  console.log("Server started on 0.0.0.0:" + config.PORT);
});
