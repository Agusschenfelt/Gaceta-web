import { skip } from "../_lib/arbiter.js";
import { roundEndpoint } from "../_lib/http.js";

// POST { token, attempt } -> { round, token }
export default roundEndpoint((body, round, deps) => skip({ round, attempt: body.attempt }, deps));
