const mongoose = require('mongoose');
const { AUTOMATION_RULE_TYPE, AUTOMATION_SOURCE } = require('../utils/constants');

const { Schema } = mongoose;

const automationRuleSchema = new Schema(
  {
    deviceId: { type: String, required: true, index: true },
    relayId: { type: String, required: true },

    enabled: { type: Boolean, default: true },

    ruleType: {
      type: String,
      enum: Object.values(AUTOMATION_RULE_TYPE),
      default: AUTOMATION_RULE_TYPE.TEMPERATURE_HIGH,
    },

    // Which sensor zones feed this rule (dynamic list, e.g. ["upper","middle","lower"])
    zones: { type: [String], default: [] },
    source: {
      type: String,
      enum: Object.values(AUTOMATION_SOURCE),
      default: AUTOMATION_SOURCE.MAX_OF_ZONES,
    },

    thresholdOn: { type: Number, required: true },
    thresholdOff: { type: Number, required: true },
  },
  { timestamps: true }
);

automationRuleSchema.index({ deviceId: 1, relayId: 1 }, { unique: true });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
