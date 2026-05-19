import {
  appendJsonl,
  buildAdditionalContext,
  hookEventsPath,
  readStdinJson,
  writeAdditionalContext,
} from "./shared.mjs";

const event = await readStdinJson();

appendJsonl(hookEventsPath, {
  at: new Date().toISOString(),
  hook: "SessionStart",
  event,
});

writeAdditionalContext("SessionStart", buildAdditionalContext());
