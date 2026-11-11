import { guess } from "../_lib/arbiter.js";
import { roundEndpoint } from "../_lib/http.js";

// POST { token, trackId, attempt } -> { round, token }
export default roundEndpoint((body, round, deps) =>
  guess({ round, trackId: body.trackId, attempt: body.attempt }, deps),
);
