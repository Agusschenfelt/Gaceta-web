import { start } from "../_lib/arbiter.js";
import { roundEndpoint } from "../_lib/http.js";

// POST { token?, artists?, level?, exclude? } -> { round, token }
export default roundEndpoint((body, round, deps) =>
  start({ round, artists: body.artists, level: body.level, exclude: body.exclude }, deps),
);
