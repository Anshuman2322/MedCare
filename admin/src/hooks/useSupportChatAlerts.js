import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatSummary, CHAT_CHANGED } from '../api/chatApi.js';
import { playChime, showCountInTitle, showDesktopNotification } from '../utils/chatAlerts.js';

const REFRESH_MS = 20000;
const ALERTED_KEY = 'cureneed-admin-chat-alerted';

const readAlerted = () => {
  try {
    return Date.parse(sessionStorage.getItem(ALERTED_KEY) || '') || 0;
  } catch {
    return 0;
  }
};
const writeAlerted = (at) => {
  try {
    sessionStorage.setItem(ALERTED_KEY, new Date(at).toISOString());
  } catch {
    // Storage can be blocked; alerts then repeat at most once per page load.
  }
};

// Runs on every admin page (from the sidebar): keeps the Support Chat badge
// current and, when a customer starts waiting or writes again, plays a chime
// and shows a desktop notification that opens that conversation.
export default function useSupportChatAlerts(enabled) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ needsReply: 0, waiting: 0, latest: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let firstLoad = true;

    const refresh = async () => {
      try {
        const { data } = await getChatSummary();
        if (!active) return;
        setSummary(data || {});
        showCountInTitle(data?.needsReply || 0);

        const latestAt = Date.parse(data?.latest?.at || '') || 0;
        if (latestAt > readAlerted()) {
          // Opening the panel shows the badge; only news after that rings.
          if (!firstLoad) {
            playChime();
            showDesktopNotification({
              title: `${data.latest.name} is waiting in Support Chat`,
              body: data.latest.preview || 'A customer wants to talk to the team.',
              onClick: () => navigate(`/support-chat?c=${data.latest.id}`),
            });
          }
          writeAlerted(latestAt);
        }
        firstLoad = false;
      } catch {
        // The next refresh tries again.
      }
    };

    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener(CHAT_CHANGED, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(CHAT_CHANGED, refresh);
      showCountInTitle(0);
    };
  }, [enabled, navigate]);

  return summary;
}
