/** @typedef {{modeId: string, rulesVersion: number}} Ruleset */
const CLASSIC_RULESET = Object.freeze({ modeId: 'classic', rulesVersion: 1 });
const CURRENT_RULESET = Object.freeze({ modeId: 'expanded', rulesVersion: 1 });

function isClassicRuleset(ruleset) {
  return (
    ruleset.modeId === CLASSIC_RULESET.modeId &&
    ruleset.rulesVersion === CLASSIC_RULESET.rulesVersion
  );
}

export { CLASSIC_RULESET, CURRENT_RULESET, isClassicRuleset };
