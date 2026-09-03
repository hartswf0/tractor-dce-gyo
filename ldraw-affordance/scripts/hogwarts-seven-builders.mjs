// CHATGPT SEVEN — LLM authority gate.
//
// This file intentionally has NO autonomous builder policy. The previous version
// encoded seven deterministic heuristics behind the names of seven prompts. That
// is not the experiment. Each construction transition must be authored by an
// actual LLM turn running one standalone POML and that agent's own external state.
// Deterministic code may validate, measure, render, or execute an LLM-authored
// proposal, but it may not choose the next part or simulate a prompt strategy.

const agents=[
  'field-builder','cook-ding','decompiler','beaver-error-surface',
  'epistemic-builder','constraint-sorcerer','strange-builder'
];

if(process.argv[2]==='about'){
  console.log(JSON.stringify({
    schema:'chatgpt-seven-llm-authority-gate-1',
    autonomousBuilder:false,
    generativeAuthority:'LLM_ONLY',
    agents,
    rule:'Every next action must arrive as an LLM-authored proposal from the named agent loop.'
  },null,2));
  process.exit(0);
}

throw new Error(
  'AUTONOMOUS_SEVEN_BUILDER_DISABLED: ChatGPT must run seven persistent prompt loops. '+
  'Use the chatgpt-seven experiment scheduler and validate only explicit LLM-authored proposals.'
);
