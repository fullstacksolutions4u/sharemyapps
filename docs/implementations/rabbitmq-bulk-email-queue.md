# RabbitMQ Integration — Scheduled Bulk Email Queue

> **Status:** 📋 Documentation Only — Not Yet Implemented  
> **Purpose:** This document explains how to integrate RabbitMQ into the ShareMyApps project to replace the current `setInterval`-based bulk email scheduler with a proper, production-grade message queue.

---

## 1. The Problem with the Current Approach

The current bulk email flow lives in [`server/jobs/jobAlertScheduler.js`](../../server/jobs/jobAlertScheduler.js):

```js
// Current: polling every 60 seconds with setInterval
setInterval(() => {
  processDueJobAlerts();
}, 60 * 1000);
```

### Pain Points

| Issue | Current Behaviour | With RabbitMQ |
|---|---|---|
| **Scaling** | Only one instance can run; duplicate processing is guarded by a DB write trick | Multiple worker instances can consume from the same queue safely |
| **Failure recovery** | If the server crashes mid-send, emails in that chunk are lost | Unacknowledged messages are automatically re-queued |
| **Visibility** | No dashboard — you can only check logs | RabbitMQ Management UI shows queue depth, message rates, errors |
| **Back-pressure** | Event loop sleeps (`setTimeout 100ms`) are a manual workaround | Queue naturally limits throughput; workers process at their own pace |
| **Email provider routing** | Brevo → SendPulse → Resend fallback is done inline | Can be split into separate queues per provider |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express API Server                       │
│                                                                 │
│  Admin creates Job Alert  ──►  Producer publishes message       │
│  (scheduledAt field set)        to "job_alerts" exchange        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          RabbitMQ Broker                        │
│                                                                 │
│   Exchange: job_alerts (direct)                                 │
│   ┌─────────────────────────────────────┐                       │
│   │  Queue: email.scheduled             │  ← scheduled alerts   │
│   │  Queue: email.immediate             │  ← transactional mails│
│   │  Queue: email.dead_letter           │  ← failed after retry │
│   └─────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │ Worker 1 │   │ Worker 2 │   │ Worker 3 │
            │(Consumer)│   │(Consumer)│   │(Consumer)│
            └──────────┘   └──────────┘   └──────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │   Email Providers (Fallback)  │
                    │   Brevo → SendPulse → Resend  │
                    └───────────────────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │    MongoDB     │
                           │  (mark sent,  │
                           │  insert notif)│
                           └────────────────┘
```

### Queue Definitions

| Queue | Purpose | TTL | Max Retries |
|---|---|---|---|
| `email.scheduled` | Holds job alert batches waiting to be sent | 24 hours | 3 |
| `email.immediate` | Transactional emails (welcome, reset, payment) | 30 min | 5 |
| `email.dead_letter` | Failed messages after max retries — for manual review | None | — |

---

## 3. Proposed Folder Structure

```
server/
├── queue/                          ← NEW
│   ├── connection.js               ← RabbitMQ connection singleton
│   ├── setup.js                    ← Declare exchanges, queues & bindings
│   ├── producers/
│   │   └── jobAlertProducer.js     ← Publishes job alert messages
│   └── consumers/
│       └── emailConsumer.js        ← Processes email messages from queue
├── jobs/
│   └── jobAlertScheduler.js        ← MODIFIED: publishes to queue instead of sending directly
├── utils/
│   └── email.js                    ← UNCHANGED: still handles actual sending
└── index.js                        ← MODIFIED: start consumers on boot
```

---

## 4. Dependencies to Install

```bash
npm install amqplib
```

> **`amqplib`** is the official Node.js AMQP 0-9-1 client, the protocol RabbitMQ uses.  
> Install RabbitMQ locally via Docker for development:
>
> ```bash
> docker run -d --name rabbitmq \
>   -p 5672:5672 \
>   -p 15672:15672 \
>   rabbitmq:3-management
> ```
>
> Management UI: `http://localhost:15672` (default login: `guest` / `guest`)

---

## 5. Environment Variables

Add these to your `.env` and `.env.example`:

```env
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

In production (e.g., CloudAMQP free tier):

```env
RABBITMQ_URL=amqps://user:password@xxxxx.cloudamqp.com/vhost
```

---

## 6. Code Walkthrough

### 6.1 — `queue/connection.js` (Singleton Connection)

```js
// server/queue/connection.js
const amqp = require('amqplib');

let connection = null;
let channel = null;

async function getChannel() {
  if (channel) return channel;

  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Automatically try to reconnect if connection drops
  connection.on('error', (err) => {
    console.error('[RabbitMQ] Connection error:', err.message);
    channel = null;
    connection = null;
  });
  connection.on('close', () => {
    console.warn('[RabbitMQ] Connection closed. Will reconnect on next request.');
    channel = null;
    connection = null;
  });

  return channel;
}

module.exports = { getChannel };
```

---

### 6.2 — `queue/setup.js` (Declare Queues & Exchanges)

> Run this **once** on server startup to ensure queues exist before producers or consumers start.

```js
// server/queue/setup.js
const { getChannel } = require('./connection');

const EXCHANGE = 'job_alerts';
const DEAD_LETTER_EXCHANGE = 'email.dlx';

async function setupQueues() {
  const ch = await getChannel();

  // 1. Dead Letter Exchange (receives failed messages)
  await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', { durable: true });
  await ch.assertQueue('email.dead_letter', { durable: true });
  await ch.bindQueue('email.dead_letter', DEAD_LETTER_EXCHANGE, 'dead');

  // 2. Main Exchange
  await ch.assertExchange(EXCHANGE, 'direct', { durable: true });

  // 3. Scheduled email queue (for bulk job alerts)
  await ch.assertQueue('email.scheduled', {
    durable: true,          // survives RabbitMQ restarts
    arguments: {
      'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE,
      'x-dead-letter-routing-key': 'dead',
      'x-message-ttl': 24 * 60 * 60 * 1000,  // 24 hours
    },
  });
  await ch.bindQueue('email.scheduled', EXCHANGE, 'scheduled');

  // 4. Immediate transactional email queue
  await ch.assertQueue('email.immediate', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE,
      'x-dead-letter-routing-key': 'dead',
      'x-message-ttl': 30 * 60 * 1000,       // 30 minutes
    },
  });
  await ch.bindQueue('email.immediate', EXCHANGE, 'immediate');

  console.log('[RabbitMQ] Queues and exchanges declared successfully.');
}

module.exports = { setupQueues, EXCHANGE };
```

---

### 6.3 — `queue/producers/jobAlertProducer.js` (Publisher)

```js
// server/queue/producers/jobAlertProducer.js
const { getChannel } = require('../connection');
const { EXCHANGE } = require('../setup');

/**
 * Publishes a job alert batch message to the queue.
 * @param {Object} payload
 * @param {string} payload.alertId       - MongoDB ObjectId of the JobAlert document
 * @param {string[]} payload.recipientIds - Array of User ObjectIds to notify
 * @param {number} payload.retryCount     - Internal retry counter (default 0)
 */
async function publishJobAlertBatch(payload) {
  const ch = await getChannel();

  const message = {
    alertId: payload.alertId,
    recipientIds: payload.recipientIds,
    retryCount: payload.retryCount || 0,
    publishedAt: new Date().toISOString(),
  };

  ch.publish(
    EXCHANGE,
    'scheduled',            // routing key → binds to 'email.scheduled' queue
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,     // message survives broker restart
      contentType: 'application/json',
    }
  );

  console.log(`[Producer] Published job alert batch: alertId=${payload.alertId}, recipients=${payload.recipientIds.length}`);
}

module.exports = { publishJobAlertBatch };
```

---

### 6.4 — `queue/consumers/emailConsumer.js` (Worker)

```js
// server/queue/consumers/emailConsumer.js
const { getChannel } = require('../connection');
const { publishJobAlertBatch } = require('../producers/jobAlertProducer');
const JobAlert = require('../../models/JobAlert');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { sendJobAlertEmail } = require('../../utils/email');

const QUEUE = 'email.scheduled';
const MAX_RETRIES = 3;
const EMAIL_CHUNK_SIZE = 50;
const NOTIFICATION_CHUNK_SIZE = 500;

const JOB_ALERT_TITLE = 'New Job Openings 🎯';
const JOB_ALERT_MESSAGE = 'New hiring opportunities are live! Check your dashboard for company and recruiters email IDs and career page links — share your CV or upload your resume to apply directly.';

async function startEmailConsumer() {
  const ch = await getChannel();

  // prefetch(1) = process ONE message at a time per worker
  // This is the key to fair dispatch — busy workers don't get more messages
  await ch.prefetch(1);

  await ch.consume(QUEUE, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch {
      // Malformed message — reject without requeue (goes to dead letter)
      ch.nack(msg, false, false);
      return;
    }

    const { alertId, recipientIds, retryCount } = payload;

    try {
      // --- 1. Fetch the job alert ---
      const alert = await JobAlert.findById(alertId).lean();
      if (!alert) {
        console.warn(`[Consumer] JobAlert ${alertId} not found. Discarding.`);
        ch.ack(msg);
        return;
      }

      // --- 2. Fetch recipients ---
      const recipients = await User.find({ _id: { $in: recipientIds } })
        .select('name email')
        .lean();

      // --- 3. Bulk create in-app notifications ---
      const notifications = recipients.map(u => ({
        user:     u._id,
        type:     'job_alert',
        title:    JOB_ALERT_TITLE,
        message:  JOB_ALERT_MESSAGE,
        jobAlert: alert._id,
      }));

      for (let i = 0; i < notifications.length; i += NOTIFICATION_CHUNK_SIZE) {
        const chunk = notifications.slice(i, i + NOTIFICATION_CHUNK_SIZE);
        await Notification.insertMany(chunk, { ordered: false })
          .catch(err => console.error('[Consumer] Notification insert error:', err));
      }

      // --- 4. Send emails in chunks ---
      for (let i = 0; i < recipients.length; i += EMAIL_CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + EMAIL_CHUNK_SIZE);
        await Promise.all(
          chunk.map(u =>
            sendJobAlertEmail({ to: u.email, name: u.name })
              .catch(err => console.error(`[Consumer] Email error for ${u.email}:`, err))
          )
        );
      }

      // --- 5. Mark alert as notified ---
      await JobAlert.updateOne({ _id: alertId }, { notified: true });

      // Acknowledge — message removed from queue ✅
      ch.ack(msg);
      console.log(`[Consumer] ✅ Job alert ${alertId} processed. Emails sent: ${recipients.length}`);

    } catch (err) {
      console.error(`[Consumer] ❌ Error processing alertId=${alertId}:`, err.message);

      if (retryCount < MAX_RETRIES) {
        // Re-publish with incremented retry count (manual exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          publishJobAlertBatch({ alertId, recipientIds, retryCount: retryCount + 1 });
        }, delay);
        // Acknowledge original (we manually re-published a new one)
        ch.ack(msg);
        console.warn(`[Consumer] Retry ${retryCount + 1}/${MAX_RETRIES} scheduled in ${delay}ms for alertId=${alertId}`);
      } else {
        // Max retries exceeded — reject and send to Dead Letter Queue
        ch.nack(msg, false, false);
        console.error(`[Consumer] 💀 alertId=${alertId} moved to dead letter queue after ${MAX_RETRIES} retries.`);
      }
    }
  });

  console.log('[RabbitMQ] Email consumer started. Listening on:', QUEUE);
}

module.exports = { startEmailConsumer };
```

---

### 6.5 — Modified `jobs/jobAlertScheduler.js` (Producer Side)

Instead of processing emails directly, the scheduler now only **publishes** messages to the queue:

```js
// server/jobs/jobAlertScheduler.js  (UPDATED)
const JobAlert = require('../models/JobAlert');
const { publishJobAlertBatch } = require('../queue/producers/jobAlertProducer');

async function processDueJobAlerts() {
  // Find all due alerts
  const due = await JobAlert.find({
    notified: false,
    isDraft: false,
    scheduledAt: { $lte: new Date() }
  }).select('_id recipients');

  for (const { _id, recipients } of due) {
    // Atomically claim the alert to prevent duplicate publishing
    const alert = await JobAlert.findOneAndUpdate(
      { _id, notified: false },
      { notified: 'queued' },   // Use 'queued' as intermediate state
      { new: true }
    );
    if (!alert) continue;  // Another instance already claimed it

    // Publish to RabbitMQ — the consumer does all the actual work
    await publishJobAlertBatch({
      alertId: _id.toString(),
      recipientIds: recipients.map(id => id.toString()),
    });
  }
}

function startJobAlertScheduler() {
  processDueJobAlerts().catch(err => console.error('[Scheduler] Error:', err));
  setInterval(() => {
    processDueJobAlerts().catch(err => console.error('[Scheduler] Error:', err));
  }, 60 * 1000);
}

module.exports = { startJobAlertScheduler };
```

> **Note:** Add `'queued'` as a valid value to the `notified` field in your `JobAlert` Mongoose model (or use a separate `status` enum: `draft` → `scheduled` → `queued` → `sent`).

---

### 6.6 — `index.js` — Wire Everything on Boot

```js
// In server/index.js — add after DB connection:

const { setupQueues }        = require('./queue/setup');
const { startEmailConsumer } = require('./queue/consumers/emailConsumer');

async function startServer() {
  await connectDB();           // your existing MongoDB connection

  // Setup RabbitMQ
  await setupQueues();
  await startEmailConsumer();

  // ... rest of your Express setup
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(console.error);
```

---

## 7. How Chunking Works with the Queue

Currently, 1,000 recipients = 1 batch processed inline. With RabbitMQ, you have two strategies:

### Strategy A — One Message Per Alert (Recommended to Start)

```
[Scheduler] → publishes 1 message { alertId, recipientIds: [1000 ids] }
[Consumer]  → receives it, chunks internally (50 per email send)
```

✅ Simple | ✅ No message explosion | ✅ Easy to track per-alert status

### Strategy B — One Message Per Recipient (Maximum Parallelism)

```
[Scheduler] → publishes 1000 messages { alertId, userId }
[Consumer]  → each worker handles 1 user email
```

✅ Perfect retry isolation (one failed email doesn't block others)  
⚠️ 1000 messages per alert — fine for RabbitMQ, but monitor queue depth

> **Recommendation:** Start with **Strategy A**. Move to Strategy B only if you need per-recipient retry granularity.

---

## 8. Retry & Dead Letter Strategy

```
Message published
      │
      ▼
Consumer processes
      │
   Success? ──YES──► ch.ack(msg) ──► Message deleted ✅
      │
      NO
      │
   retryCount < 3? ──YES──► Re-publish with retryCount+1
                             + exponential backoff (1s, 2s, 4s)
      │
      NO (retryCount = 3)
      │
      ▼
   ch.nack(msg, false, false)
      │
      ▼
   email.dead_letter queue 💀
      │
      ▼
   Manual inspection via RabbitMQ Management UI
   or automated alert (e.g., send Slack/email to admin)
```

---

## 9. Handling Multiple Email Providers

The existing `sendEmailWithFallback()` in `email.js` already handles Brevo → SendPulse → Resend routing. With RabbitMQ, you can optionally split this into **provider-specific queues** for finer control:

```
email.provider.brevo     ← Brevo quota < 300/day
email.provider.sendpulse ← Fallback 1
email.provider.resend    ← Fallback 2
```

**Routing logic in the consumer:**

```js
const { count } = await EmailQuota.findOne({ date: today });
const routingKey = count < 300 ? 'brevo' : 'sendpulse';
ch.publish('email_providers', routingKey, Buffer.from(JSON.stringify({ to, subject, html })));
```

> For now, since `sendEmailWithFallback()` already handles this elegantly, this split is **optional** — only consider it if you want detailed per-provider metrics.

---

## 10. Monitoring & Observability

### RabbitMQ Management UI

- URL: `http://localhost:15672` (dev) or your CloudAMQP dashboard
- Key metrics to watch:
  - **Queue depth** of `email.scheduled` — high depth = workers are slow
  - **Dead letter count** — unexpected growth means a bug in consumer
  - **Message rates** (publish/s, deliver/s)

### Logging Strategy

Each message should log:

```
[Producer] Published alertId=abc123, recipients=847
[Consumer] Processing alertId=abc123, recipientIds=847
[Consumer] ✅ Done alertId=abc123, sent=847, elapsed=12.4s
[Consumer] ❌ Error alertId=abc123, retry=1/3
[Consumer] 💀 Dead letter alertId=abc123 after 3 retries
```

### Health Check Endpoint (Optional)

```js
// Add to your Express routes
app.get('/health/queue', async (req, res) => {
  try {
    const ch = await getChannel();
    const info = await ch.checkQueue('email.scheduled');
    res.json({
      status: 'ok',
      queueDepth: info.messageCount,
      consumerCount: info.consumerCount,
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});
```

---

## 11. Production Deployment Considerations

| Concern | Recommendation |
|---|---|
| **RabbitMQ hosting** | [CloudAMQP](https://www.cloudamqp.com/) free tier (1M messages/month) is ideal for this scale |
| **Connection resilience** | Wrap `getChannel()` with retry logic + exponential backoff on reconnect |
| **Worker scaling** | Run 2–3 consumer instances. RabbitMQ round-robins messages automatically |
| **Docker** | Add RabbitMQ as a service in `docker-compose.yml` |
| **Graceful shutdown** | On `SIGTERM`, stop consuming new messages, wait for in-flight to finish, then close channel |

### Docker Compose Snippet

```yaml
# Add to docker-compose.yml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: yourpassword

volumes:
  rabbitmq_data:
```

---

## 12. Migration Steps (When Ready to Implement)

- [ ] **Step 1:** Install `amqplib` — `npm install amqplib`
- [ ] **Step 2:** Add `RABBITMQ_URL` to `.env` and `.env.example`
- [ ] **Step 3:** Create `server/queue/connection.js`
- [ ] **Step 4:** Create `server/queue/setup.js`
- [ ] **Step 5:** Create `server/queue/producers/jobAlertProducer.js`
- [ ] **Step 6:** Create `server/queue/consumers/emailConsumer.js`
- [ ] **Step 7:** Update `JobAlert` model — add `'queued'` state for `notified` field
- [ ] **Step 8:** Modify `server/jobs/jobAlertScheduler.js` to publish instead of send
- [ ] **Step 9:** Wire `setupQueues()` and `startEmailConsumer()` in `server/index.js`
- [ ] **Step 10:** Test locally with Docker RabbitMQ, verify Management UI
- [ ] **Step 11:** Deploy RabbitMQ (CloudAMQP) and update production `.env`

---

## 13. Related Documentation

- [`docs/system design/12-message-queues.md`](../system%20design/12-message-queues.md) — Conceptual overview of Message Queues
- [`server/jobs/jobAlertScheduler.js`](../../server/jobs/jobAlertScheduler.js) — Current scheduler (to be migrated)
- [`server/utils/email.js`](../../server/utils/email.js) — Email sending utility with Brevo/SendPulse/Resend fallback
- [amqplib npm](https://www.npmjs.com/package/amqplib) — Node.js AMQP client
- [CloudAMQP](https://www.cloudamqp.com/) — Hosted RabbitMQ (free tier available)
- [RabbitMQ Management Plugin](https://www.rabbitmq.com/management.html) — Browser dashboard docs
