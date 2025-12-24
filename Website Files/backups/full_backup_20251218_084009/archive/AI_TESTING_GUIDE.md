# VortexAI Testing Guide - Professional IT Consultant

## Quick Test Checklist

### ✅ PC Building Tests (Existing Functionality)

#### Budget Build Recommendations

- [ ] "Build me a £800 gaming PC"
- [ ] "£1500 1440p gaming build"
- [ ] "£2500 4K workstation for video editing"
- [ ] "Budget £600 PC for my kid"

**Expected:** Detailed component list with rationale for each part

#### Component Comparisons

- [ ] "Compare 7800X3D vs 9800X3D"
- [ ] "RTX 4070 vs RX 7800 XT"
- [ ] "9600X vs 14600K for gaming"
- [ ] "AM5 vs LGA1700 platform"

**Expected:** Head-to-head comparison with winner recommendation

#### Compatibility Checks

- [ ] Paste a build list and ask for compatibility check
- [ ] "Will a 650W PSU be enough for RTX 4070?"
- [ ] "Does B650 motherboard support DDR5?"

**Expected:** Professional compatibility analysis with warnings

### ✅ Troubleshooting Tests (NEW FEATURE)

#### Boot Issues

- [ ] "My PC won't turn on"
- [ ] "Computer starts but no display"
- [ ] "PC beeps when I turn it on"
- [ ] "Stuck on BIOS screen"
- [ ] "Boot loop - keeps restarting"

**Expected:** Step-by-step diagnostic procedure starting with power checks

#### Performance Problems

- [ ] "Getting low FPS in games suddenly"
- [ ] "PC feels slow after Windows update"
- [ ] "Games are stuttering"
- [ ] "CPU running at 95°C"
- [ ] "GPU not performing as expected"

**Expected:** Temperature checks, driver verification, bottleneck analysis

#### Crashes and Instability

- [ ] "Blue screen of death (BSOD)"
- [ ] "PC crashes during gaming"
- [ ] "Random freezes"
- [ ] "Programs keep closing unexpectedly"

**Expected:** Memory testing, Event Viewer checks, stability diagnostics

#### Hardware Issues

- [ ] "RAM not detected"
- [ ] "GPU fans not spinning"
- [ ] "USB ports not working"
- [ ] "No audio output"
- [ ] "Internet keeps disconnecting"

**Expected:** Systematic hardware diagnostics with clear next steps

### ✅ Professional Guidance Tests

#### Vague Questions (Should Ask for Details)

- [ ] "I need a gaming PC"
- [ ] "What CPU should I buy?"
- [ ] "My PC has problems"
- [ ] "Want to upgrade"

**Expected:** AI should ask clarifying questions (budget, use case, symptoms)

#### Complex Scenarios

- [ ] "Best CPU for 1440p 240Hz gaming and streaming?"
- [ ] "Upgrade my i5-10400 system - what's the best path?"
- [ ] "PC crashes only in certain games - why?"
- [ ] "Building a silent workstation for 8K video editing"

**Expected:** Nuanced, multi-faceted responses with trade-off explanations

#### Edge Cases

- [ ] "Is RGB lighting worth it?"
- [ ] "Air cooling vs water cooling?"
- [ ] "Gen4 vs Gen5 NVMe for gaming?"
- [ ] "32GB vs 64GB RAM for 3D rendering?"

**Expected:** Honest pros/cons, value analysis, practical recommendations

## Test Scenarios by User Type

### 🎮 First-Time Builder

**Test:** "I want to build my first gaming PC but don't know where to start"
**Expected:**

- Friendly, educational tone
- Asks about budget, resolution target, favorite games
- Provides tiered options (budget/balanced/premium)
- Explains component roles clearly

### 💼 Professional/Workstation User

**Test:** "Need a PC for 4K video editing in DaVinci Resolve"
**Expected:**

- Focus on CPU cores, RAM capacity, GPU VRAM
- Asks about workflow specifics (codecs, export frequency)
- Mentions storage speed importance (scratch disk)
- Professional component recommendations (not gaming focus)

### 🔧 Experienced Upgrader

**Test:** "Current: i7-9700K, RTX 3070, 16GB DDR4. Looking to upgrade"
**Expected:**

- Asks about specific pain points (low FPS, slow renders?)
- Identifies bottleneck (probably CPU for latest games)
- Multi-phase upgrade plan
- Platform migration guidance (AM5 longevity vs value)

### 🆘 Troubleshooting User

**Test:** "Built my PC yesterday, turns on but nothing on screen"
**Expected:**

- Calm, systematic approach
- Asks about beeps, LED indicators
- Step-by-step diagnostics:
  1. Check monitor/cable connection
  2. Try integrated graphics (if available)
  3. Reseat RAM
  4. Check CPU power cable
  5. Test with one RAM stick
- Clear next steps if issue persists

## AI Mode Testing

### 🔧 Rules Mode

Test each of the above with Rules Mode enabled:

- Should use predefined responses where possible
- Fast response times (no API call)
- Falls back to generic helpful message when unsure

### 🤖 Hybrid Mode (Recommended)

Test mixed scenarios:

- Common questions (budget builds, comparisons) → Rules
- Complex troubleshooting → AI fallback
- Vague questions → AI for natural conversation
- Should see "Thinking..." only for complex queries

### ✨ AI-Only Mode

Test natural conversation flow:

- All responses through GPT-4o-mini
- More conversational, adaptive
- Better at handling complex, multi-part questions
- Costs tokens but highest quality

## Response Quality Checklist

Every AI response should:

- [ ] Be specific (mention exact models/part numbers when relevant)
- [ ] Include reasoning (WHY this recommendation)
- [ ] Set realistic expectations (honest about trade-offs)
- [ ] Provide actionable next steps
- [ ] Use UK pricing (£) when discussing costs
- [ ] Stay professional but friendly
- [ ] Ask clarifying questions if user input is vague
- [ ] Include follow-up suggestions

## Red Flags (Should NOT Happen)

❌ Generic responses like "That's a good question"
❌ Recommending outdated components (check dates in system prompt)
❌ US pricing ($) instead of UK (£)
❌ Overly technical jargon without explanation
❌ False promises ("guaranteed 200 FPS in all games")
❌ Recommending components that don't exist
❌ Ignoring user's budget constraints
❌ Troubleshooting without gathering symptoms

## Performance Benchmarks

### Rules Mode

- Response time: <500ms
- Cost: £0
- Coverage: ~60-70% of common questions

### Hybrid Mode

- Rules response: <500ms
- AI fallback: 2-3 seconds
- Cost: ~£0.10-0.30/day (typical usage)
- Coverage: ~95% of questions

### AI-Only Mode

- Response time: 2-4 seconds
- Cost: ~£0.50-1.00/day (heavy usage)
- Coverage: 100% of questions

## Escalation Tests

Test when AI should recommend professional help:

- [ ] "Burning smell from PSU"
- [ ] "Liquid spilled on motherboard"
- [ ] "CPU pins bent - can I fix?"
- [ ] "Laptop screen replacement"
- [ ] "Data recovery from dead drive"

**Expected:** AI should acknowledge severity, recommend professional service, explain why

## Continuous Improvement

Track these metrics:

1. **Deflection rate:** % of troubleshooting questions resolved without human support
2. **Build conversion:** % of build recommendations that lead to purchases
3. **User satisfaction:** Thumbs up/down on responses
4. **Mode usage:** Which AI mode do users prefer?
5. **Common gaps:** What questions does AI struggle with?

## Developer Testing

```bash
# Start dev server
npm run dev

# Open browser
# Navigate to site
# Click AI assistant icon
# Run through test scenarios

# Check console for:
# - API errors
# - Mode switching confirmations
# - Token usage warnings
# - Streaming chunk counts
```

## Bug Reporting Template

When reporting AI issues:

```
**Mode:** Rules / Hybrid / AI-Only / Expert
**User Input:** "exact question asked"
**Expected Response:** What should have happened
**Actual Response:** What actually happened
**Console Errors:** Any errors in browser console
**Timestamp:** When it occurred
**Browser:** Chrome/Firefox/Safari/Edge
```

---

## Quick Wins to Test First

1. ✅ "£1200 gaming PC" → Should get instant build
2. ✅ "7800X3D vs 9800X3D" → Should get detailed comparison
3. ✅ "PC won't boot" → Should get troubleshooting steps
4. ✅ "Best CPU?" → Should ask clarifying questions
5. ✅ UI shows "IT Professional Assistant" subtitle

If these 5 work, the upgrade is successful! 🎉
