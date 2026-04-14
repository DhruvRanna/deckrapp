

## Plan: Fix Swipe Card UI Issues + Dodo Payments Guide

### Issues identified from screenshots

1. **Card bottom shadow looks bad** — The heavy `boxShadow` on the card creates an ugly dark shadow at the bottom. Need a softer, more natural shadow.

2. **Card gets cut off by action buttons** — The action buttons (X, Star, Check) have colored backgrounds (`bg-skip-light`, `bg-script-light`, `bg-save-light`) which visually cut into the card. Solution: Remove button backgrounds, make them transparent or just use subtle borders.

3. **Gap between hashtags and bottom metrics** — The `mt-auto` on the bottom metrics grid pushes it to the bottom, leaving a visible gap after hashtags. Change `mt-auto` to `mt-1` so metrics follow directly after hashtags with no space.

### Technical Changes

**File: `src/pages/SwipeScreen.tsx`**

- **Shadow fix (line 234)**: Change `boxShadow` to a softer shadow like `"0 8px 30px -10px rgba(0,0,0,0.15)"` instead of the current heavy 0.3 opacity shadow. Also soften the next-card shadow (line 221).

- **Remove gap after hashtags (line 298)**: Change `mt-auto` to `mt-1` on the bottom metrics `div`, so BEST TIME / REACH / DURATION starts right after hashtags.

- **Action buttons no background (lines 358-366)**: Remove `bg-skip-light`, `bg-script-light`, `bg-save-light`, and `shadow-md`/`shadow-lg` from the three buttons. Use `bg-transparent border border-skip/20` style or just keep icons without backgrounds. This prevents the card from appearing "cut off" by the button circles.

- **Card overflow**: The card area container (line 216) has `overflow-hidden` which clips the card bottom. Adjust to `overflow-visible` so the card shadow renders fully, and let the action buttons sit naturally below the card.

### Dodo Payments Setup Guide (No code change needed)

Here is the step-by-step process:

**Step 1: Create Dodo Payments Account**
- Go to [dodopayments.com](https://dodopayments.com) and sign up
- Complete business verification

**Step 2: Create Products in Dodo Dashboard**
- Go to **Products** section in Dodo dashboard
- Create 4 subscription products:

| Product Name | Price | Billing | 
|---|---|---|
| DECKR Creator Monthly | $5/month | Recurring Monthly |
| DECKR Creator Yearly | $49/year | Recurring Yearly |
| DECKR Pro Monthly | $19/month | Recurring Monthly |
| DECKR Pro Yearly | $149/year | Recurring Yearly |

**Step 3: Copy Product IDs**
- After creating each product, Dodo gives you a Product ID (e.g., `pdt_xxxxxxxxxxxxx`)
- Copy all 4 product IDs

**Step 4: Update the Code**
- In `supabase/functions/create-checkout/index.ts`, replace the placeholder IDs:
```
CREATOR: {
  monthly: "pdt_xxxxx",  // your Creator Monthly product ID
  yearly: "pdt_xxxxx",   // your Creator Yearly product ID
},
PRO: {
  monthly: "pdt_xxxxx",  // your Pro Monthly product ID  
  yearly: "pdt_xxxxx",   // your Pro Yearly product ID
},
```

**Step 5: Set Up Webhook**
- In Dodo dashboard, go to **Webhooks** 
- Add webhook URL: `https://eknfzwprgefuacbeeuln.supabase.co/functions/v1/dodo-webhook`
- Select events: `subscription.active`, `subscription.cancelled`, `payment.succeeded`
- The webhook secret is already saved in your backend secrets as `DODO_PAYMENTS_WEBHOOK_SECRET`

**Step 6: Test**
- Use Dodo's **test mode** (the code already uses `test.dodopayments.com`)
- Try a test checkout from the Plans screen
- Once working, switch `baseUrl` to `https://api.dodopayments.com` for live payments

