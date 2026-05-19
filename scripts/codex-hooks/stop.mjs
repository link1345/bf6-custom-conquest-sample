import {
  appendJsonl,
  hookEventsPath,
  readStdinJson,
} from "./shared.mjs";

const event = await readStdinJson();

appendJsonl(hookEventsPath, {
  at: new Date().toISOString(),
  hook: "Stop",
  event,
});
