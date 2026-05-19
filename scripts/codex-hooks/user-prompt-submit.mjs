import {
  appendJsonl,
  buildAdditionalContext,
  extractPrompt,
  hookEventsPath,
  portalLogPath,
  promptKnowledgePath,
  promptLooksKnowledgeWorthy,
  promptLooksLikeRuntimeFailure,
  readStdinJson,
  writeAdditionalContext,
} from "./shared.mjs";

const event = await readStdinJson();
const prompt = extractPrompt(event);
const runtimeFailure = promptLooksLikeRuntimeFailure(prompt);
const knowledgeWorthy = promptLooksKnowledgeWorthy(prompt);

appendJsonl(hookEventsPath, {
  at: new Date().toISOString(),
  hook: "UserPromptSubmit",
  runtimeFailure,
  knowledgeWorthy,
});

if (prompt && (runtimeFailure || knowledgeWorthy)) {
  appendJsonl(promptKnowledgePath, {
    at: new Date().toISOString(),
    source: "UserPromptSubmit",
    tags: [
      ...(runtimeFailure ? ["runtime-failure", "portal-log-required"] : []),
      ...(knowledgeWorthy ? ["knowledge-candidate"] : []),
    ],
    prompt,
  });
}

const extraSections = [];
if (runtimeFailure) {
  extraSections.push(
    [
      "Runtime failure hook:",
      `- The user appears to report that something does not work. Before diagnosing BF6 Portal behavior, inspect \`${portalLogPath}\` and summarize the relevant log lines.`,
    ].join("\n"),
  );
}

writeAdditionalContext("UserPromptSubmit", buildAdditionalContext(extraSections));
