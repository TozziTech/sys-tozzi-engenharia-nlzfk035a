export function sendSlackNotification(
  webhookUrl: string | undefined,
  title: string,
  message: string,
) {
  if (!webhookUrl) return

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Timestamp:* ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  }

  console.log('[Slack Notification Mock]', JSON.stringify(payload, null, 2))
}
