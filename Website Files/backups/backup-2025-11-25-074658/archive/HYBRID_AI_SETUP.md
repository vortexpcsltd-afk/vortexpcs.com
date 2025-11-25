# Hybrid AI Mode Setup Guide

## Overview

VortexAI now supports **3 modes**:

1. **🔧 Rules Mode** (Default) - Fast, free rule-based responses
2. **🤖 Hybrid Mode** - Smart mix: rules first, AI for complex questions
3. **✨ AI-Only Mode** - Full GPT-4o-mini power for all responses

## Quick Start

### 1. Get OpenAI API Key

```bash
# Visit https://platform.openai.com/api-keys
# Create new API key
# Copy the key (starts with sk-...)
```

### 2. Add to Environment

```bash
# Copy the example file
cp .env.ai.example .env.local

# Edit .env.local and add your key
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Deploy or Run Locally

```bash
# Local development
npm run dev

# Or deploy to Vercel (auto-detects env vars)
vercel --prod
```

### 4. Test It Out

- Click the **🤖 Hybrid** button in VortexAI
- Ask a complex question like: "What's the best CPU for video editing under £400?"
- Watch it use real AI when rules don't have a good answer!

## How It Works

### Rules Mode 🔧

- Budget detection → Instant build recommendations
- Component comparisons (7600X vs 13600K, etc.)
- Compatibility checks
- PSU sizing, platform comparisons
- **Pros:** Free, instant, predictable
- **Cons:** Limited to pre-programmed knowledge

### Hybrid Mode 🤖 (Recommended)

- Tries rules first (fast & free)
- Detects if response is too generic
- Falls back to GPT-4o-mini for nuanced questions
- **Pros:** Best of both worlds, cost-effective
- **Cons:** Slight delay on AI fallback (~2-3s)

### AI-Only Mode ✨

- Every message uses GPT-4o-mini
- Natural conversation flow
- Handles ANY PC building question
- **Pros:** Most intelligent, handles edge cases
- **Cons:** Costs ~£0.10-0.30/day for moderate use

## Cost Estimates

Based on typical usage (100 queries/day):

| Mode    | Cost/Month | Best For                             |
| ------- | ---------- | ------------------------------------ |
| Rules   | £0         | Known questions, builds, comparisons |
| Hybrid  | £5-10      | General use (AI ~20% of queries)     |
| AI-Only | £20-40     | Premium experience, complex queries  |

With **Expert Mode ON**, AI uses GPT-4o (10x more expensive but more capable).

## Advanced: Vercel AI Gateway

For production, route requests through Vercel AI Gateway for:

- **Response caching** (same question = instant, free repeat)
- **Rate limiting** (protect against abuse)
- **Analytics** (track token usage, costs)
- **Fallback providers** (OpenAI → Anthropic failover)

Setup:

```bash
# 1. Enable gateway at dashboard.ai.vercel.com
# 2. Get your gateway URL
# 3. Add to .env.local
OPENAI_BASE_URL=https://gateway.ai.vercel.com/v1/your-account-id/your-gateway-slug/openai
```

## Troubleshooting

### "AI mode temporarily unavailable"

- Check OPENAI_API_KEY is set correctly
- Verify API key has credits: https://platform.openai.com/usage
- Check API endpoint logs for errors

### Slow responses

- Hybrid mode should be fast (rules first)
- AI-only mode has ~2-3s latency (normal for GPT-4o-mini)
- Expert Mode with GPT-4o can be 3-5s (more powerful model)

### High costs

- Switch to Hybrid mode (only uses AI when needed)
- Enable Vercel AI Gateway caching
- Use gpt-4o-mini instead of gpt-4o (10x cheaper)

## Security

- Never commit `.env.local` (already in .gitignore)
- Rotate keys if exposed
- Use Vercel environment variables for production
- Consider rate limiting on API endpoint for public sites

## Monitoring

View usage at:

- OpenAI Dashboard: https://platform.openai.com/usage
- Vercel AI Gateway: https://dashboard.ai.vercel.com (if enabled)

## Support

Questions? The hybrid system logs to console:

```bash
# Look for these logs
"AI mode temporarily unavailable" → Check API key
"Real AI error:" → Network or API issue
```
