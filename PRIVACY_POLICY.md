# ScreenSense — Privacy Policy

**Effective date: February 2026**

ScreenSense ("we", "our", "the app") is built by an independent developer. This Privacy Policy explains what we collect, why, and the choices you have. We aim to write it in plain English, not lawyer-speak.

## 1. Summary in 30 seconds
- We track **how long you use apps on YOUR phone**. That's the entire product.
- This data **stays on your device by default**. We do not have a copy.
- The only data that leaves your phone is what you type into the **AI Coach**, which we send to Anthropic to generate a reply.
- We do **not** sell your data. We do **not** train models on your data. We do **not** share your data with advertisers.
- We have **no ads**. ScreenSense is funded by an optional Pro subscription.

## 2. What we collect

### 2.1 On-device only (never leaves your phone)
- App usage statistics from Android's `UsageStatsManager` (which apps you opened, for how long, and when). This is read-only and only after you grant the **Usage Access** permission in system Settings.
- Call duration aggregates from `UsageStatsManager` events for the dialer app. **We do not read your call log, contacts, or call content.**
- The categories, daily limits, focus-mode rules, and goals you create.
- Your AI Coach chat history.

### 2.2 Sent to our servers
- **AI Coach prompts**: when you ask the Coach a question, we send your message and a brief summary of today's usage stats (top 5 apps, total minutes, pickups, notification count) to our backend, which forwards it to Anthropic's Claude Sonnet 4.5 to generate a response. We do not retain these prompts after the response is generated.
- **Subscription state**: when you start a free trial or purchase, Google Play sends us a purchase token, which we verify against the Google Play Developer API. We store the token, your subscription tier, and the renewal date.
- **Anonymous error reports** (if enabled in Settings): crash stack traces and the app version. No personal identifiers.

### 2.3 What we explicitly do NOT collect
- Specific URLs or web pages you visit
- Message content from any app
- Call audio or contact lists
- Your location
- Photos, files, or any other media
- Health data
- Advertising identifiers

## 3. Why we collect it
- **App usage stats**: to show you the dashboard. That is the entire purpose.
- **Coach prompts**: to generate a reply. We do not log them long-term.
- **Subscription token**: to remember that you paid, so we don't ask you again.

## 4. Who we share with
- **Anthropic (Claude Sonnet 4.5)** — receives your Coach prompt and the brief usage summary above. Anthropic's policy is at https://www.anthropic.com/privacy. They do not train on API requests.
- **Google Play** — handles your subscription. We never see your card details.
- **Nobody else.** No analytics SDKs, no ad networks, no tracking pixels.

## 5. Permissions we request
| Permission | Why |
|---|---|
| `PACKAGE_USAGE_STATS` | The core product. Read which apps you used and for how long. |
| `READ_PHONE_STATE` | Detect call events for call-time tracking. We do not read numbers or content. |
| `QUERY_ALL_PACKAGES` | Map installed app package names to a friendly category (e.g., `com.instagram.android` → "Social Media"). |
| `POST_NOTIFICATIONS` | Send your daily summary at 9pm if you enable it. |

You can revoke any of these in Android Settings at any time. The app gracefully degrades.

## 6. Data retention
- On-device data lives until you delete the app or clear its data in Android Settings.
- Coach chat history is stored on our server until you tap **Clear chat** in the Coach tab. We will also delete it automatically 90 days after your last message.
- Subscription records are kept for 7 years for tax and accounting compliance, then deleted.

## 7. Your rights
You may, at any time:
- **Export your data** — Settings → Privacy → Export. We give you a JSON file with everything.
- **Delete your data** — Settings → Privacy → Delete account & data. Removes the Coach history and subscription records on our server.
- **Object, restrict, or correct** — email us at the address below.

If you are in the EU/UK, you have rights under GDPR. If you are in California, you have rights under CCPA. We honour both for everyone — not just users in those jurisdictions.

## 8. Children
ScreenSense is not directed at children under 13 and we do not knowingly collect data from them. If you believe a child has used the app, contact us and we will delete their data.

## 9. Security
- All API requests use HTTPS (TLS 1.2+).
- Subscription tokens are stored encrypted at rest.
- We follow the principle of least privilege: the database account used by the app cannot delete tables, only read/write its own collections.

We are a small operation. We cannot promise a Fortune-500-grade security perimeter. We can promise that we collect very little and care a lot.

## 10. International transfers
Our servers are hosted in the United States. By using ScreenSense outside the US, you consent to the transfer of the limited data described above to the US.

## 11. Changes to this policy
If we change anything material, we will post a notice in the app and update the "Effective date" at the top. We will not retroactively reduce your privacy without an in-app notice.

## 12. Contact
support@screensense.app

---
ScreenSense is a product of an independent developer. This policy is written in good faith and the simple language reflects the simple architecture of the app: most of your data never leaves your phone.
